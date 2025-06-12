import json
import os
import glob
import random
import subprocess
from datetime import datetime
from pathlib import Path

import eel
import FilePaths
from Log import log_to_file
from llamafactory.chat import ChatModel
from llamafactory.extras.misc import torch_gc
from trainingConfig import TrainingConfig
import sys
import torch
from email_manager import notify_all

os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"


sys.stdout.reconfigure(encoding='utf-8', errors='replace')

currentPath = os.getcwd()
basePath = os.getcwd()

models = {
    "llama-3-8b-instruct": "meta-llama/Meta-Llama-3-8B-Instruct"
}

############################################
#               global variables

messages = []
outputDir = ""
chat_model: ChatModel
baseModel = ""
projectID = ""

def startTrain(config_path):
    config = TrainingConfig.from_directory(config_path)

    file_key = f"{config.slug}_{datetime.now().strftime('%d%m%H%M%S')}"
    run_id = datetime.now().strftime("run_%Y%m%d_%H%M")

    addDatasetRow(config.dataset_path, config.slug, file_key, run_id)

    defineParameters(
        models[config.model_name],
        config.learning_rate,
        config.num_epochs,
        config.warmup_ratio,
        config.max_seq_length,
        config.fp16,
        config.batch_size,
        config.gradient_accumulation_steps,
        file_key,
        config.slug,
        run_id
    )

def reset():
    global messages, outputDir, chat_model, baseModel, projectID
    messages = []
    outputDir = ""
    chat_model = None
    baseModel = ""
    projectID = ""
    torch_gc()

def createDB(filePath):
    with open(f"{filePath}", "r", encoding="utf-8") as f:
        data = json.load(f)

    allD = []
    for i in data:
        example = {
            "instruction": i["question"],
            "input": "",
            "output": i["answer"]
        }
        allD.append(example)
    return allD

def addDatasetRow(filePath, slug, file_key, run_id):
    global outputDir, projectID
    projectID = slug
    outputDir = Path(os.path.join("models", slug, "trained", run_id)).as_posix()
    os.makedirs(outputDir, exist_ok=True)

    data = createDB(filePath)
    jsonl_path = os.path.join(FilePaths.llamaFactory, FilePaths.modelPath, f"training_data_{file_key}.jsonl")

    with open(jsonl_path, 'w', encoding='utf-8') as f:
        for example in data:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')

    models_json_path = os.path.join(FilePaths.llamaFactory, FilePaths.modelPath, FilePaths.modelsJson)
    with open(models_json_path, "r", encoding="utf-8") as f:
        allModels = json.load(f)

    if file_key not in allModels:
        allModels[file_key] = {
            "file_name": f"training_data_{file_key}.jsonl"
        }
        with open(models_json_path, 'w', encoding='utf-8') as f:
            json.dump(allModels, f, indent=4)
        print(f"Added key: {file_key}")

def defineParameters(base_model, learningRate, epochs, warmupRatio, maxLength, FP16, batchSize, gradientAccumulationSteps, file_key, slug, run_id):
    global baseModel, outputDir
    baseModel = base_model
    outputDir = Path(os.path.join("models", slug, "trained", run_id)).as_posix()
    os.makedirs(outputDir, exist_ok=True)
    os.chdir(currentPath)

    template = "llama3"
    normalized_output_dir = os.path.abspath(outputDir).replace("\\", "/")

    args = dict(
        stage="sft",
        do_train=True,
        model_name_or_path=baseModel,
        dataset=file_key,
        template=template,
        finetuning_type="lora",
        lora_target="all",
        output_dir=normalized_output_dir,
        per_device_train_batch_size=batchSize,
        gradient_accumulation_steps=gradientAccumulationSteps,
        gradient_checkpointing=True,
        lr_scheduler_type="cosine",
        logging_steps=10,
        warmup_ratio=warmupRatio,
        save_steps=1000,
        learning_rate=learningRate,
        num_train_epochs=epochs,
        max_samples=1000,
        max_grad_norm=8,
        loraplus_lr_ratio=16.0,
        fp16=FP16,
        use_liger_kernel=False,
        report_to="none",
        trust_remote_code=True,
        cutoff_len=maxLength,
        save_strategy="epoch",
    )

    json.dump(args, open(os.path.join(outputDir, "data.json"), "w", encoding="utf-8"), indent=2)
    log_to_file(args, os.path.join(outputDir, "parameters.json"))
    doTrain()

    checkpoint_dirs = sorted(glob.glob(os.path.join(outputDir, "checkpoint-*")), reverse=True)
    checkpoint_dir = checkpoint_dirs[0] if checkpoint_dirs else outputDir

    import shutil
    for filename in ["adapter_config.json", "adapter_model.safetensors"]:
        src = os.path.join(checkpoint_dir, filename)
        dst = os.path.join(outputDir, filename)
        if os.path.exists(src) and os.path.abspath(src) != os.path.abspath(dst):
            shutil.copy(src, dst)

def safe_print(text, end="\n", flush=False):
    try:
        print(text, end=end, flush=flush)
    except UnicodeEncodeError:
        fallback = text.encode("utf-8", errors="replace").decode("utf-8")
        print(fallback, end=end, flush=flush)

def doTrain():
    torch.cuda.empty_cache()
    torch.cuda.ipc_collect()
    torch.cuda.reset_peak_memory_stats()
    torch_gc()
    data_path = os.path.abspath(os.path.join(outputDir, "data.json")).replace("\\", "/")

    command = ["llamafactory-cli", "train", data_path]

    try:
        print(f"הרצת אימון עם קובץ: {data_path}")
        process = subprocess.Popen(
            command,
            cwd=FilePaths.llamaFactory,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace'
        )

        for line in process.stdout:
            safe_print(line, end="", flush=True)
        process.wait()

        print("✅ האימון הסתיים בהצלחה!")
        notify_all()
        eel.training_complete_js()

    except Exception as e:
        print(f"שגיאה באימון: {e}")

    os.chdir(currentPath)

import glob

def setTestModel(temperature):
    global chat_model
    adapter_path = None
    outputDirUnix = os.path.normpath(outputDir)  # ← מתקן את ה־\ או / לפי מערכת ההפעלה
    pattern = os.path.join(outputDirUnix, "checkpoint-*")
    checkpoints = sorted(glob.glob(pattern), reverse=True)
    print(checkpoints)

    for path in checkpoints + [outputDirUnix]:
        print(os.path.join(path, "adapter_model.safetensors"))
        if os.path.exists(os.path.join(path, "adapter_model.safetensors")):
            print("found")
            adapter_path = path
            break

    if not adapter_path:
        raise FileNotFoundError(f"לא נמצאו checkpoint-ים בתיקייה '{outputDir}'.")
    adapter_path = os.path.join(currentPath,adapter_path)
    os.chdir(FilePaths.llamaFactory)

    testArgs = dict(
        model_name_or_path=baseModel,
        adapter_name_or_path=adapter_path,
        template="llama3",
        finetuning_type="lora",
        quantization_bit=4,
        temperature=temperature,
        trust_remote_code=True,
        infer_backend="huggingface",
        max_new_tokens=512
    )

    print("ARGS FOR INFERENCE:")
    print(testArgs)

    chat_model = ChatModel(testArgs)

def question(query, temperature):
    if not chat_model:
        setTestModel(temperature)
    messages.append({"role": "user", "content": query})
    response = ""
    for new_text in chat_model.stream_chat(messages):
        print(new_text, end="", flush=True)
        response += new_text
    messages.append({"role": "assistant", "content": response})
    print(messages)
