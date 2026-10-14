import os
import cv2
import csv
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import pickle

DATASET_DIR = "dataset/images"
LABEL_FILE = "dataset/labels.csv"
MODEL_SAVE_PATH = "captcha_model.h5"
VOCAB_SAVE_PATH = "vocab.pkl"

IMG_WIDTH = 200
IMG_HEIGHT = 50
BATCH_SIZE = 16
EPOCHS = 100

def load_data():
    if not os.path.exists(LABEL_FILE):
        print(f"Lỗi: Không tìm thấy {LABEL_FILE}. Vui lòng chạy label_captchas_ui.py để gán nhãn trước.")
        return None, None, None, None

    images = []
    labels = []
    characters = set()
    max_length = 0
    
    with open(LABEL_FILE, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) == 2:
                img_name, label = row
                img_path = os.path.join(DATASET_DIR, img_name)
                if os.path.exists(img_path):
                    images.append(img_path)
                    labels.append(label)
                    for char in label:
                        characters.add(char)
                    if len(label) > max_length:
                        max_length = len(label)
                        
    characters = sorted(list(characters))
    return images, labels, characters, max_length

def encode_single_sample(img_path, label, char_to_num, max_length, vocab_size):
    img = tf.io.read_file(img_path)
    img = tf.io.decode_jpeg(img, channels=1)
    img = tf.image.convert_image_dtype(img, tf.float32)
    img = tf.image.resize(img, [IMG_HEIGHT, IMG_WIDTH])
    img = tf.transpose(img, perm=[1, 0, 2])
    
    if label is not None:
        label = char_to_num(tf.strings.unicode_split(label, input_encoding="UTF-8"))
        # Pad label to max_length
        pad_size = max_length - tf.shape(label)[0]
        label = tf.pad(label, paddings=[[0, pad_size]], constant_values=vocab_size)
        return {"image": img, "label": label}
    return {"image": img}

class CTCLayer(layers.Layer):
    def __init__(self, name=None):
        super().__init__(name=name)
        self.loss_fn = keras.backend.ctc_batch_cost

    def call(self, y_true, y_pred):
        batch_len = tf.cast(tf.shape(y_true)[0], dtype="int64")
        input_length = tf.cast(tf.shape(y_pred)[1], dtype="int64")
        label_length = tf.cast(tf.shape(y_true)[1], dtype="int64")

        input_length = input_length * tf.ones(shape=(batch_len, 1), dtype="int64")
        label_length = label_length * tf.ones(shape=(batch_len, 1), dtype="int64")

        loss = self.loss_fn(y_true, y_pred, input_length, label_length)
        self.add_loss(loss)
        return y_pred

def build_model(img_width, img_height, vocab_size):
    input_img = layers.Input(shape=(img_width, img_height, 1), name="image", dtype="float32")
    labels = layers.Input(name="label", shape=(None,), dtype="float32")

    x = layers.Conv2D(32, (3, 3), activation="relu", kernel_initializer="he_normal", padding="same", name="Conv1")(input_img)
    x = layers.MaxPooling2D((2, 2), name="pool1")(x)
    x = layers.Conv2D(64, (3, 3), activation="relu", kernel_initializer="he_normal", padding="same", name="Conv2")(x)
    x = layers.MaxPooling2D((2, 2), name="pool2")(x)

    new_shape = ((img_width // 4), (img_height // 4) * 64)
    x = layers.Reshape(target_shape=new_shape, name="reshape")(x)
    x = layers.Dense(64, activation="relu", name="dense1")(x)
    x = layers.Dropout(0.2)(x)

    x = layers.Bidirectional(layers.LSTM(128, return_sequences=True, dropout=0.25))(x)
    x = layers.Bidirectional(layers.LSTM(64, return_sequences=True, dropout=0.25))(x)
    
    x = layers.Dense(vocab_size + 2, activation="softmax", name="dense2")(x)

    output = CTCLayer(name="ctc_loss")(labels, x)
    
    model = keras.models.Model(inputs=[input_img, labels], outputs=output, name="ocr_model_v1")
    model.compile(optimizer=keras.optimizers.Adam())
    
    prediction_model = keras.models.Model(inputs=input_img, outputs=x, name="prediction_model")
    return model, prediction_model

def train():
    images, labels, characters, max_length = load_data()
    if images is None:
        return

    print(f"Tổng số ảnh: {len(images)}")
    print(f"Tập ký tự ({len(characters)}): {characters}")
    print(f"Độ dài chuỗi lớn nhất: {max_length}")

    char_to_num = layers.StringLookup(vocabulary=list(characters), mask_token=None)
    num_to_char = layers.StringLookup(vocabulary=char_to_num.get_vocabulary(), mask_token=None, invert=True)

    # Lưu vocab để dự đoán sau này
    with open(VOCAB_SAVE_PATH, 'wb') as f:
        pickle.dump({'vocab': char_to_num.get_vocabulary(), 'max_length': max_length}, f)

    # Chia tập train/val
    split_idx = int(0.9 * len(images))
    x_train, x_val = images[:split_idx], images[split_idx:]
    y_train, y_val = labels[:split_idx], labels[split_idx:]

    vocab_size = len(char_to_num.get_vocabulary())

    train_dataset = tf.data.Dataset.from_tensor_slices((x_train, y_train))
    train_dataset = (
        train_dataset.map(lambda x, y: encode_single_sample(x, y, char_to_num, max_length, vocab_size), num_parallel_calls=tf.data.AUTOTUNE)
        .batch(BATCH_SIZE)
        .prefetch(buffer_size=tf.data.AUTOTUNE)
    )

    val_dataset = tf.data.Dataset.from_tensor_slices((x_val, y_val))
    val_dataset = (
        val_dataset.map(lambda x, y: encode_single_sample(x, y, char_to_num, max_length, vocab_size), num_parallel_calls=tf.data.AUTOTUNE)
        .batch(BATCH_SIZE)
        .prefetch(buffer_size=tf.data.AUTOTUNE)
    )

    model, prediction_model = build_model(IMG_WIDTH, IMG_HEIGHT, len(char_to_num.get_vocabulary()))
    model.summary()

    early_stopping = keras.callbacks.EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True)

    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=EPOCHS,
        callbacks=[early_stopping],
    )

    # Chỉ lưu phần dự đoán (bỏ qua layer CTCLayer và label input)
    prediction_model.save(MODEL_SAVE_PATH)
    print(f"Đã lưu mô hình tại {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train()
