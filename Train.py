import json
import os
import glob
import random
import shutil
import subprocess
import traceback
from datetime import datetime
from pathlib import Path

import eel
import yaml
from multipart import file_path

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

models ={
  "llama-3-8b-instruct": {
    "source": "meta-llama/Meta-Llama-3-8B-Instruct",
    "template": "llama3",
 "from": "llama3"

  },
 "DeepSeek-R1-Distill-Llama-8B": {
    "source": "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
    "template": "llama3",
     "from": "llama3"
 },
  "Mistral-7B-Instruct-v0.3": {
    "source": "mistralai/Mistral-7B-Instruct-v0.3",
    "template": "mistral",
      "from": "mistral"

  },
  "Aya-23-8B-Chat": {
    "source": "CohereForAI/aya-23-8B",
    "template": "cohere",
      "from": "command-r"
  },
  "Yi-6B-Chat": {
    "source": "01-ai/Yi-6B-Chat",
    "template": "yi",
      "from": "yi"
  },
  "Qwen-7B": {
    "source": "Qwen/Qwen-7B",
    "template": "qwen",
      "from": "qwen"
  }
}

############################################
#               global variables
process = None
messages = []
outputDir = ""
chat_model: ChatModel
baseModel = ""
projectID = ""
template = ""


def startTrain(config_path):
    config = TrainingConfig.from_directory(config_path)

    file_key = f"{config.slug}_{datetime.now().strftime('%d%m%H%M%S')}"
    run_id = datetime.now().strftime("run_%Y%m%d_%H%M")

    addDatasetRow(config.dataset_path, config.slug, file_key, run_id)

    defineParameters(
        config.model_name,
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

    return config.slug

@eel.expose
def stop_fine_tuning():
    global process
    if process and process.poll() is None:
        process.terminate()
        print("תהליך האימון הופסק.")
        return "stopped"
    else:
        print(" אין תהליך פעיל כרגע.")
        return "not_running"


def reset():
    global messages, outputDir, chat_model, baseModel, projectID
    messages = []
    outputDir = ""
    chat_model = None
    baseModel = ""
    projectID = ""
    template = ""
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
    global baseModel, outputDir,template
    baseModel = models[base_model]["source"]
    template = models[base_model]["template"]
    outputDir = Path(os.path.join("models", slug, "trained", run_id)).as_posix()
    os.makedirs(outputDir, exist_ok=True)



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
    doTrain(slug)

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

def doTrain(slug):
    global process
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
            errors='replace',
        )

        for line in process.stdout:
            safe_print(line, end="", flush=True)
        process.wait()

        print("✅ האימון הסתיים בהצלחה!")
        notify_all(slug)
        eel.training_complete_js()

    except Exception as e:
        print(f"שגיאה באימון: {e}")



import glob

def findLastAdapter(run_path):
    run_path_norm = os.path.normpath(run_path)
    pattern = os.path.join(run_path_norm, "checkpoint-*")
    checkpoints = sorted(glob.glob(pattern), reverse=True)
    print(checkpoints)

    for path in checkpoints + [run_path_norm]:
        adapter_file = os.path.join(path, "adapter_model.safetensors")
        config_file = os.path.join(path, "adapter_config.json")
        print(f"בודק: {adapter_file}")
        if os.path.exists(adapter_file) and os.path.exists(config_file):
            print("✅ נמצא checkpoint תקין עם קובץ adapter ו־config")
            return os.path.abspath(path)  # מחזיר את התיקייה – לא את הקובץ

    raise FileNotFoundError(f"❌ לא נמצאו checkpoint-ים עם adapter_model ו־adapter_config בתיקייה '{run_path}'.")

def setTestModel(temperature, adapter_path, max_tokens=512):
    global chat_model

    if not adapter_path:
        print("❌ לא סופק adapter_path – לא ניתן לטעון את המודל")
        return

    testArgs = dict(
        model_name_or_path=baseModel,          # ← עכשיו מחרוזת תקינה
        adapter_name_or_path=adapter_path,
        template=template,
        finetuning_type="lora",
        quantization_bit=4,
        temperature=temperature,
        trust_remote_code=True,
        infer_backend="huggingface",
        max_new_tokens=max_tokens,
    )

    print("ARGS FOR INFERENCE:")
    print(testArgs)

    chat_model = ChatModel(testArgs)

def question(query, temperature, max_tokens):
    if not chat_model:
        setTestModel(temperature, max_tokens)
    messages.append({"role": "user", "content": query})
    response = ""
    for new_text in chat_model.stream_chat(messages):
        print(new_text, end="", flush=True)
        response += new_text
    messages.append({"role": "assistant", "content": response})
    print(messages)
    return messages


"""
יש 2 סוגים של ייצוא - לhuggingface ולlmstudio
בכל מקרה כדי ליצא לlmstudio צריך לייצא לhf
שימו לב לפרמטר q_type - הוא משפיע על דחיסת המודל
f16 - ביצועים טובים, מודל כבד 
q8_0 - קטן יותר - קצת פחות מדוייק
q6_K - פגיעה בדיוק, מתאים ללפטופים
"""

"""
def exportModel(q_type="f16"):

    adapter_path = findLastAdapter()
    if not adapter_path:
        return
    exported_path = os.path.join( currentPath, "models", projectID, "exported")
    os.makedirs(exported_path, exist_ok=True)

    output_path = os.path.join(exported_path,"hf_export")
    yaml_path = os.path.join(exported_path,"export_configs.yaml")

    # הגדרות ייצוא
    export_config = {
        "model_name_or_path": baseModel["source"],
        "adapter_name_or_path": adapter_path,
        "template": baseModel["template"],
        "finetuning_type": "lora",
        "export_dir": output_path,
        "export_legacy_format": False,
    }


    # שמירת הקובץ
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(export_config, f, default_flow_style=False, allow_unicode=True)

    print(f"נוצר קובץ YAML: {yaml_path}")


    # הפעלת הפקודה
    try:
        subprocess.run(
            ["llamafactory-cli", "export", yaml_path],
            check=True,
            cwd=FilePaths.llamaFactory)

        print("הייצוא לhf הושלם בהצלחה.")
    except subprocess.CalledProcessError as e:
        print("הפקודה נכשלה:")
        print(e)
        return

    #   המרה לgguf
    gguf_path = os.path.join(exported_path,f"{projectID}.gguf")

    try:
        subprocess.run([
            "python", "convert_hf_to_gguf.py",
            "--outtype", q_type,
            "--outfile", gguf_path,
            output_path  # מיקום המודל המאוחד
        ],
        check=True,
        cwd=FilePaths.llamacpp)

        print("ייצוא לlmstudio הושלם")
        os.startfile(exported_path) #פתיחה של התיקייה

    except subprocess.CalledProcessError as e:
        print("הפקודה נכשלה:")
        print(e)
        return
"""

def exportModel(slug, q_type="q8_0"):
    print(f"📥 export_model_js קיבלה slug: {slug}")
    print("📥 התחלה: exportModel הופעלה")

    if not slug:
        print("❌ slug לא הוגדר – לא ניתן לייצא")
        return {"success": False, "error": "slug לא הוגדר"}

    print(f"ℹ️ slug: {slug}")

    # מציאת תיקיית הריצה האחרונה
    trained_path = os.path.join(currentPath, "models", slug, "trained")
    print(f"📁 מחפש ריצות בנתיב: {trained_path}")

    try:
        run_dirs = [d for d in os.listdir(trained_path) if d.startswith("run_")]
    except FileNotFoundError:
        return {"success": False, "error": "תיקיית trained לא קיימת"}

    if not run_dirs:
        return {"success": False, "error": "לא נמצאו ריצות אימון"}

    run_dirs.sort(reverse=True)
    last_run = run_dirs[0]
    run_path = os.path.join(trained_path, last_run)
    outputDir = run_path

    print(f"✅ תיקיית ריצה שנבחרה: {run_path}")

    # מציאת checkpoint אחרון
    try:
        adapter_path = findLastAdapter(run_path)
        print(f"🔗 adapter_path נמצא: {adapter_path}")
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": f"שגיאה במציאת checkpoint: {str(e)}"}

    # יצירת תיקיית exported
    exported_path = os.path.join(run_path, "exported")
    os.makedirs(exported_path, exist_ok=True)
    print(f"📂 נוצרה תיקיית exported: {exported_path}")

    output_path = os.path.join(exported_path, "hf_export")
    yaml_path = os.path.join(exported_path, "export_configs.yaml")

    # קריאה לקובץ פרמטרים
    params_path = os.path.join(run_path, "parameters.json")
    if not os.path.exists(params_path):
        return {"success": False, "error": "לא נמצא parameters.json"}

    with open(params_path, "r", encoding="utf-8") as f:
        params = json.load(f)

    if isinstance(params, list) and len(params) > 0:
        params = params[0]
    elif not isinstance(params, dict):
        return {"success": False, "error": "קובץ parameters.json בפורמט לא צפוי"}

    base_model_path = params.get("model_name_or_path")
    template_name = params.get("template")

    if not base_model_path or not template_name:
        return {"success": False, "error": "חסרים נתונים בקובץ parameters.json"}

    # יצירת קובץ YAML
    export_config = {
        "model_name_or_path": base_model_path,
        "adapter_name_or_path": adapter_path,
        "template": template_name,
        "finetuning_type": "lora",
        "export_dir": output_path,
        "export_legacy_format": False,
    }

    try:
        with open(yaml_path, "w", encoding="utf-8") as f:
            yaml.dump(export_config, f, default_flow_style=False, allow_unicode=True)
        print(f"📝 נוצר קובץ YAML: {yaml_path}")
    except Exception as e:
        return {"success": False, "error": f"שגיאה בשמירת YAML: {str(e)}"}

    try:
        subprocess.run(["llamafactory-cli", "export", yaml_path],
                       check=True, cwd=FilePaths.llamaFactory)
        print("✅ הייצוא ל-HF הושלם בהצלחה.")
    except subprocess.CalledProcessError as e:
        traceback.print_exc()
        return {"success": False, "error": "הפקודה llamafactory export נכשלה"}

    # המרה ל-GGUF
    gguf_path = os.path.join(exported_path, f"{slug}.gguf")
    try:
        subprocess.run([
            "python", "convert_hf_to_gguf.py",
            "--outtype", q_type,
            "--outfile", gguf_path,
            output_path
        ],
            check=True,
            cwd=FilePaths.llamacpp
        )
        print(f"✅ ייצוא ל-GGUF הושלם: {gguf_path}")
    except subprocess.CalledProcessError as e:
        traceback.print_exc()
        return {"success": False, "error": "המרה ל-GGUF נכשלה"}

    #יצירת modelfile
    modelfile_content = f"FROM {gguf_path}\n"
    modelfile_path = os.path.join(exported_path,"Modelfile")
    with open(modelfile_path, 'w') as f:
        f.write(modelfile_content)
        print(f"modelfile created at {modelfile_path}")

    # טעינה לollama
    try:
        subprocess.run([
            "ollama", "create", slug,
            "-f", "Modelfile"
        ],
            check=True,
            cwd=exported_path
        )
        print(f"Ollama created the model: {slug}")
    except subprocess.CalledProcessError as e:
        traceback.print_exc()
        return {"success": False, "error": "טעינה ל-Ollama נכשלה"}

    # יצירת ZIP
    print(f" פותח את תיקיית המודל: {exported_path}")
    try:
        os.startfile(exported_path)
    except Exception as e:
        print(f" לא הצליח לפתוח את התיקייה: {e}")
        return {"success": False, "error": "לא ניתן לפתוח את תיקיית המודל"}

    #  אם הצליח – מחזירים הצלחה לסיום הפופאפ
    return {"success": True}


    return {
        "success": True,
        "folder_path": os.path.abspath(exported_path).replace("\\", "/"),
        "message": f"המודל יוצא ונשמר בתיקייה:\n{exported_path}"
    }

