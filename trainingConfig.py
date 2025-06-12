import json
import os
from dataclasses import dataclass


@dataclass
class TrainingConfig:
    learning_rate: float
    batch_size: float
    num_epochs: float
    gradient_accumulation_steps: float
    warmup_ratio: float
    model_name: str
    max_seq_length: int
    fp16: bool
    dataset_path: str
    slug: str

    @classmethod
    def from_dict(cls, config: dict) -> "TrainingConfig":
        return cls(
            learning_rate=config.get("learning_rate", 0.0001),
            batch_size=config.get("batch_size", 32.0),
            num_epochs=config.get("num_epochs", 3.0),
            gradient_accumulation_steps=config.get("gradient_accumulation_steps", 1.0),
            warmup_ratio=config.get("warmup_ratio", 0.1),
            model_name=config.get("model_name", "model"),
            max_seq_length=config.get("max_seq_length", 512),
            fp16=bool(config.get("fp16", False)),
            dataset_path=config.get("dataset_path", ""),
            slug=config.get("slug", "")
        )

    @classmethod
    def from_directory(cls, config_file_path: str) -> "TrainingConfig":
        # בודקים אם הקובץ קיים בתיקייה
        if not os.path.exists(config_file_path):
            print(f"Error: The file {config_file_path} does not exist.")
            return None

        try:
            with open(config_file_path, 'r', encoding='utf-8') as file:
                config_dict = json.load(file)  # טוענים את הקובץ כ-JSON
                return cls.from_dict(config_dict)  # מחזירים את אובייקט המחלקה
        except json.JSONDecodeError:
            print("Error decoding JSON from the file.")
            return None
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
