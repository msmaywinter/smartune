import  os

home_dir = os.path.expanduser("~")


llamaFactory = os.path.join(home_dir,"LLaMA-Factory")

modelPath = "data"

modelsJson = "dataset_info.json"

currentPath = os.getcwd()

llamacpp = os.path.join(home_dir,"llama.cpp")

lmstudio = os.path.join(home_dir,".lmstudio")