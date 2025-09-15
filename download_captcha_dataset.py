"""
Script tải 500 captcha để training AI
"""

import requests
import time
import os
import json
from datetime import datetime
from captcha_decoder import decode_captcha

def download_captcha_dataset(num_captchas=500, output_dir="captcha_dataset"):
    """
    Tải dataset captcha để training AI
    
    Args:
        num_captchas: Số lượng captcha cần tải
        output_dir: Thư mục lưu trữ
    """
    print(f"🚀 Bắt đầu tải {num_captchas} captcha để training AI")
    print(f"📁 Thư mục lưu trữ: {output_dir}")
    print("=" * 60)
    
    # Tạo thư mục nếu chưa có
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"✅ Đã tạo thư mục: {output_dir}")
    
    # Tạo thư mục con cho ảnh và labels
    images_dir = os.path.join(output_dir, "images")
    labels_dir = os.path.join(output_dir, "labels")
    
    if not os.path.exists(images_dir):
        os.makedirs(images_dir)
    if not os.path.exists(labels_dir):
        os.makedirs(labels_dir)
    
    # URL captcha
    captcha_url = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
    
    # Session để duy trì cookie
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
    })
    
    # Thống kê
    stats = {
        'total_downloaded': 0,
        'successful_decoded': 0,
        'failed_decoded': 0,
        'start_time': datetime.now(),
        'captcha_data': []
    }
    
    print(f"📊 Bắt đầu tải từ: {stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    for i in range(1, num_captchas + 1):
        try:
            print(f"📋 Tải captcha {i}/{num_captchas}")
            
            # Tải captcha
            response = session.get(captcha_url, timeout=10)
            response.raise_for_status()
            
            # Tạo tên file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]  # Loại bỏ 3 chữ số cuối của microsecond
            image_filename = f"captcha_{i:04d}_{timestamp}.jpg"
            image_path = os.path.join(images_dir, image_filename)
            
            # Lưu ảnh
            with open(image_path, 'wb') as f:
                f.write(response.content)
            
            print(f"   ✅ Đã tải: {image_filename} ({len(response.content)} bytes)")
            
            # Giải mã captcha
            print(f"   🔍 Đang giải mã...")
            decoded_text = decode_captcha(image_path)
            
            if decoded_text:
                print(f"   ✅ Giải mã thành công: {decoded_text}")
                stats['successful_decoded'] += 1
                
                # Lưu label
                label_filename = f"captcha_{i:04d}_{timestamp}.txt"
                label_path = os.path.join(labels_dir, label_filename)
                
                with open(label_path, 'w', encoding='utf-8') as f:
                    f.write(decoded_text)
                
                # Lưu metadata
                captcha_info = {
                    'id': i,
                    'image_file': image_filename,
                    'label_file': label_filename,
                    'decoded_text': decoded_text,
                    'timestamp': timestamp,
                    'file_size': len(response.content)
                }
                stats['captcha_data'].append(captcha_info)
                
            else:
                print(f"   ❌ Không thể giải mã captcha")
                stats['failed_decoded'] += 1
                
                # Xóa ảnh không giải mã được
                if os.path.exists(image_path):
                    os.remove(image_path)
                    print(f"   🗑️  Đã xóa ảnh không giải mã được")
            
            stats['total_downloaded'] += 1
            
            # Nghỉ giữa các lần tải để tránh spam server
            if i < num_captchas:
                time.sleep(1)  # Nghỉ 1 giây
            
            # Hiển thị tiến độ mỗi 10 captcha
            if i % 10 == 0:
                print(f"📊 Tiến độ: {i}/{num_captchas} ({i/num_captchas*100:.1f}%)")
                print(f"   ✅ Thành công: {stats['successful_decoded']}")
                print(f"   ❌ Thất bại: {stats['failed_decoded']}")
                print()
            
        except Exception as e:
            print(f"   ❌ Lỗi tải captcha {i}: {e}")
            continue
    
    # Hoàn thành
    stats['end_time'] = datetime.now()
    stats['duration'] = (stats['end_time'] - stats['start_time']).total_seconds()
    
    print("\n🎉 HOÀN THÀNH!")
    print("=" * 60)
    print(f"📊 Thống kê:")
    print(f"   📥 Tổng số captcha tải: {stats['total_downloaded']}")
    print(f"   ✅ Giải mã thành công: {stats['successful_decoded']}")
    print(f"   ❌ Giải mã thất bại: {stats['failed_decoded']}")
    print(f"   ⏱️  Thời gian: {stats['duration']:.1f} giây")
    print(f"   📁 Thư mục ảnh: {images_dir}")
    print(f"   📁 Thư mục labels: {labels_dir}")
    
    # Lưu metadata
    metadata_file = os.path.join(output_dir, "dataset_metadata.json")
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"   📄 Metadata: {metadata_file}")
    
    # Tạo file danh sách cho training
    create_training_files(output_dir, stats['captcha_data'])
    
    return stats

def create_training_files(output_dir, captcha_data):
    """
    Tạo các file cần thiết cho training AI
    
    Args:
        output_dir: Thư mục dataset
        captcha_data: Danh sách dữ liệu captcha
    """
    print("\n📝 Tạo file training...")
    
    # File danh sách ảnh và labels
    train_list_file = os.path.join(output_dir, "train_list.txt")
    with open(train_list_file, 'w', encoding='utf-8') as f:
        for item in captcha_data:
            f.write(f"images/{item['image_file']}\t{item['decoded_text']}\n")
    
    print(f"   ✅ Đã tạo: {train_list_file}")
    
    # File chỉ labels
    labels_file = os.path.join(output_dir, "labels.txt")
    with open(labels_file, 'w', encoding='utf-8') as f:
        for item in captcha_data:
            f.write(f"{item['decoded_text']}\n")
    
    print(f"   ✅ Đã tạo: {labels_file}")
    
    # File thống kê ký tự
    char_stats = {}
    for item in captcha_data:
        for char in item['decoded_text']:
            char_stats[char] = char_stats.get(char, 0) + 1
    
    char_stats_file = os.path.join(output_dir, "character_statistics.json")
    with open(char_stats_file, 'w', encoding='utf-8') as f:
        json.dump(char_stats, f, ensure_ascii=False, indent=2)
    
    print(f"   ✅ Đã tạo: {char_stats_file}")
    print(f"   📊 Thống kê ký tự: {len(char_stats)} ký tự khác nhau")

def main():
    """Hàm main"""
    print("🚀 Script Tải Dataset Captcha cho Training AI")
    print("=" * 60)
    
    # Cấu hình
    num_captchas = 500
    output_dir = "captcha_dataset"
    
    print(f"📋 Cấu hình:")
    print(f"   📥 Số lượng captcha: {num_captchas}")
    print(f"   📁 Thư mục output: {output_dir}")
    print(f"   🌐 URL captcha: https://tracuuhoadon.gdt.gov.vn/Captcha.jpg")
    print()
    
    try:
        stats = download_captcha_dataset(num_captchas, output_dir)
        
        print(f"\n🎯 Kết quả cuối cùng:")
        print(f"   📊 Tỷ lệ thành công: {stats['successful_decoded']/stats['total_downloaded']*100:.1f}%")
        print(f"   📁 Dataset sẵn sàng cho training AI!")
        
    except KeyboardInterrupt:
        print("\n⏹️  Đã dừng bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
