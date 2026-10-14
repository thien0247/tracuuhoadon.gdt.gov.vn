# @id 01M4V0HMQ5KCC5C04XQYAYH6NR
# @related 01M4V0FH0PZ0CY8JH8XJ6K5CNY, 01M4V0FGZN8KJG6YHQM6560EK1
"""
crawler_core.solver
Mô hình Deep Learning CRNN giải mã CAPTCHA tự động không dùng API ngoài.
"""

import os
import pickle
import logging
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

logger = logging.getLogger(__name__)

MODEL_PATH = "captcha_model.h5"
VOCAB_PATH = "vocab.pkl"
IMG_WIDTH = 200
IMG_HEIGHT = 50


class CaptchaSolver:
    """Tải trọng số mạng CRNN (Singleton) và dự đoán chuỗi ký tự từ ảnh CAPTCHA."""

    _model = None
    _num_to_char = None
    _max_length = 0
    _lock = __import__("threading").Lock()

    def __init__(self):
        self._ensure_loaded()
        self.model = CaptchaSolver._model
        self.num_to_char = CaptchaSolver._num_to_char
        self.max_length = CaptchaSolver._max_length

    @classmethod
    def _ensure_loaded(cls):
        if cls._model is not None:
            return
        with cls._lock:
            if cls._model is not None:
                return
            if not os.path.exists(MODEL_PATH) or not os.path.exists(VOCAB_PATH):
                raise FileNotFoundError("Không tìm thấy captcha_model.h5 hoặc vocab.pkl!")
            with open(VOCAB_PATH, "rb") as f:
                data = pickle.load(f)
            vocab = data["vocab"]
            cls._max_length = data["max_length"]
            char_to_num = layers.StringLookup(vocabulary=vocab, mask_token=None)
            cls._num_to_char = layers.StringLookup(
                vocabulary=char_to_num.get_vocabulary(), mask_token=None, invert=True
            )
            cls._model = keras.models.load_model(MODEL_PATH, compile=False)
            logger.info("Captcha AI model loaded successfully (Singleton).")

    def solve(self, img_bytes: bytes) -> str:
        img = tf.io.decode_image(img_bytes, channels=1, expand_animations=False)
        img = tf.image.convert_image_dtype(img, tf.float32)
        img = tf.image.resize(img, [IMG_HEIGHT, IMG_WIDTH])
        img = tf.transpose(img, perm=[1, 0, 2])
        img = tf.expand_dims(img, axis=0)

        with CaptchaSolver._lock:
            preds = self.model(img, training=False).numpy()
        input_len = np.ones(preds.shape[0]) * preds.shape[1]
        results = keras.backend.ctc_decode(
            preds, input_length=input_len, greedy=True
        )[0][0][:, :self.max_length]
        text = tf.strings.reduce_join(self.num_to_char(results[0])).numpy().decode("utf-8")
        return text.replace("[UNK]", "").strip()

