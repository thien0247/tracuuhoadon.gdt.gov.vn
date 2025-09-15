"""
Test đơn giản phương pháp mới
"""

from captcha_decoder import decode_captcha_from_url
import time

print("🔍 Test phương pháp mới: Xóa nền đen -> trong suốt -> đen")
print("=" * 60)

start_time = time.time()
result = decode_captcha_from_url()
end_time = time.time()

processing_time = end_time - start_time

if result:
    print(f"✅ Thành công!")
    print(f"🎯 Kết quả: '{result}'")
    print(f"📏 Độ dài: {len(result)} ký tự")
    print(f"⏱️  Thời gian: {processing_time:.2f} giây")
    
    if len(result) == 6:
        print("🎉 Độ dài chính xác (6 ký tự)!")
    else:
        print(f"⚠️  Độ dài không chính xác (cần 6, có {len(result)})")
else:
    print("❌ Không thể giải mã captcha")
    print(f"⏱️  Thời gian: {processing_time:.2f} giây")

print("\n🎯 Test hoàn thành!")
