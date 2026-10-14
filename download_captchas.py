import os
import requests
import time
import uuid
import ssl
import urllib3
from tqdm import tqdm

# Disable SSL Warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

URL = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
NUM_CAPTCHAS = 500
OUTPUT_DIR = "dataset/images"

def download_captchas():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Starting to download {NUM_CAPTCHAS} captchas to {OUTPUT_DIR}...")
    
    success_count = 0
    for _ in tqdm(range(NUM_CAPTCHAS)):
        try:
            response = requests.get(URL, verify=False, timeout=5)
            if response.status_code == 200:
                filename = os.path.join(OUTPUT_DIR, f"{uuid.uuid4().hex[:10]}.jpg")
                with open(filename, 'wb') as f:
                    f.write(response.content)
                success_count += 1
            # Thêm độ trễ để tránh làm quá tải server
            time.sleep(0.1)
        except Exception as e:
            print(f"Error downloading image: {e}")
            time.sleep(1)

    print(f"Done! Successfully downloaded {success_count}/{NUM_CAPTCHAS} images.")

if __name__ == "__main__":
    download_captchas()
