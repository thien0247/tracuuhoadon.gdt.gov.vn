import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import pickle
import sys

MODEL_SAVE_PATH = "captcha_model.h5"
VOCAB_SAVE_PATH = "vocab.pkl"

IMG_WIDTH = 200
IMG_HEIGHT = 50

def load_vocab():
    if not os.path.exists(VOCAB_SAVE_PATH):
        print(f"Lỗi: Không tìm thấy {VOCAB_SAVE_PATH}.")
        return None, None
    with open(VOCAB_SAVE_PATH, 'rb') as f:
        data = pickle.load(f)
    return data['vocab'], data['max_length']

def decode_batch_predictions(pred, num_to_char, max_length):
    input_len = np.ones(pred.shape[0]) * pred.shape[1]
    # Keras backend CTC decode
    results = keras.backend.ctc_decode(pred, input_length=input_len, greedy=True)[0][0][:, :max_length]
    
    output_text = []
    for res in results:
        res = tf.strings.reduce_join(num_to_char(res)).numpy().decode("utf-8")
        # Remove unknown tokens
        res = res.replace('[UNK]', '')
        output_text.append(res)
    return output_text

def solve_captcha(img_path):
    if not os.path.exists(MODEL_SAVE_PATH):
        print("Lỗi: Không tìm thấy mô hình. Bạn cần chạy train_model.py trước.")
        return

    vocab, max_length = load_vocab()
    if vocab is None:
        return

    char_to_num = layers.StringLookup(vocabulary=vocab, mask_token=None)
    num_to_char = layers.StringLookup(vocabulary=char_to_num.get_vocabulary(), mask_token=None, invert=True)

    model = keras.models.load_model(MODEL_SAVE_PATH)

    # Đọc và tiền xử lý ảnh
    img = tf.io.read_file(img_path)
    img = tf.io.decode_jpeg(img, channels=1)
    img = tf.image.convert_image_dtype(img, tf.float32)
    img = tf.image.resize(img, [IMG_HEIGHT, IMG_WIDTH])
    img = tf.transpose(img, perm=[1, 0, 2])
    img = tf.expand_dims(img, axis=0) # Add batch dimension

    # Dự đoán
    preds = model.predict(img)
    pred_texts = decode_batch_predictions(preds, num_to_char, max_length)
    
    print(f"Kết quả giải mã CAPTCHA ({img_path}): {pred_texts[0]}")
    return pred_texts[0]

if __name__ == "__main__":
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        solve_captcha(img_path)
    else:
        print("Sử dụng: python solve_captcha.py <đường_dẫn_ảnh>")
