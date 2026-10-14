import re
import time
import urllib3
import json
from curl_cffi import requests
from bs4 import BeautifulSoup
import psycopg2

from crawler_dak_lak import validate_tin

urllib3.disable_warnings()

BASE_URL = "https://hosocongty.vn"
START_URL = f"{BASE_URL}/tinh-thanh-pho.htm"
DSN = "postgresql://zzsu:Zzs%40123@localhost:5433/taxdb"

PREFIXES = {
    'Hà Nội': '01', 'Hải Phòng': '02', 'Hồ Chí Minh': '03', 'Đà Nẵng': '04', 'Hà Tây': '05',
    'Nam Định': '06', 'Hà Nam': '07', 'Hải Dương': '08', 'Hưng Yên': '09', 'Thái Bình': '10',
    'Tây Ninh': '39', 'Đồng Tháp': '14', 'Bến Tre': '13', 'Tiền Giang': '12', 'Long An': '11',
    'Vĩnh Long': '15', 'An Giang': '16', 'Kiên Giang': '17', 'Cần Thơ': '18', 'Bạc Liêu': '19',
    'Cà Mau': '20', 'Trà Vinh': '21', 'Sóc Trăng': '22', 'Bắc Ninh': '23', 'Bắc Giang': '24',
    'Vĩnh Phúc': '25', 'Phú Thọ': '26', 'Ninh Bình': '27', 'Thanh Hóa': '28', 'Nghệ An': '29',
    'Hà Tĩnh': '30', 'Quảng Bình': '31', 'Quảng Trị': '32', 'Thừa Thiên Huế': '33', 'Bình Thuận': '34',
    'Bà Rịa Vũng Tàu': '35', 'Đồng Nai': '36', 'Bình Dương': '37', 'Bình Phước': '38', 'Quảng Nam': '40',
    'Bình Định': '41', 'Khánh Hòa': '42', 'Quảng Ngãi': '43', 'Phú Yên': '44', 'Ninh Thuận': '45',
    'Thái Nguyên': '46', 'Bắc Kạn': '47', 'Cao Bằng': '48', 'Lạng Sơn': '49', 'Tuyên Quang': '50',
    'Hà Giang': '51', 'Yên Bái': '52', 'Lào Cai': '53', 'Hòa Bình': '54', 'Sơn La': '55',
    'Điện Biên': '56', 'Quảng Ninh': '57', 'Gia Lai': '59', 'Đắk Lắk': '60', 'Kon Tum': '61',
    'Lai Châu': '62', 'Hậu Giang': '63', 'Đắk Nông': '64'
}

def scrape_and_import():
    print(f"Bắt đầu tải danh sách tỉnh từ: {START_URL}")
    resp = requests.get(START_URL, impersonate="chrome124", verify=False)
    soup = BeautifulSoup(resp.content.decode('utf-8', errors='replace'), 'html.parser')
    
    links = soup.select('a')
    provinces = []
    
    for link in links:
        href = link.get('href', '')
        if href.startswith('p/') or href.startswith('/p/'):
            if not href.startswith('/'):
                href = '/' + href
            name = link.text.strip()
            provinces.append((name, BASE_URL + href))
            
    print(f"Đã tìm thấy {len(provinces)} tỉnh thành.")
    
    conn = psycopg2.connect(DSN)
    cursor = conn.cursor()
    
    for idx, (name, url) in enumerate(provinces, 1):
        # Fix possible naming differences
        lookup_name = name
        if name == 'Bà Rịa - Vũng Tàu': lookup_name = 'Bà Rịa Vũng Tàu'
        if name == 'Thừa Thiên - Huế': lookup_name = 'Thừa Thiên Huế'
            
        expected_prefix = PREFIXES.get(lookup_name)
        if not expected_prefix:
            print(f"[{idx}/{len(provinces)}] Bỏ qua {name} vì không có trong từ điển prefix.")
            continue
            
        print(f"[{idx}/{len(provinces)}] Đang quét: {name} (Prefix chuẩn: {expected_prefix}) ... ", end="")
        try:
            r = requests.get(url, impersonate="chrome124", verify=False)
            text = r.content.decode('utf-8', errors='replace')
            
            # Chỉ tìm MST hợp lệ có chứa prefix
            tins = set(re.findall(r'\b' + expected_prefix + r'\d{8}\b', text))
            valid_tins = [t for t in tins if validate_tin(t)]
            
            if not valid_tins:
                # Nếu trang chủ không có, thử lấy tạm bằng cách ghép 8 số 0
                activation_tin = expected_prefix + "00000000"
                # Nhưng mst tự chế thường sai checksum, crawler sẽ tự dò khi chạy,
                # Tuy nhiên DB yêu cầu activation_tin.
                # Do đó lấy tạm 1 MST bất kỳ từ trang web để mồi
                any_tins = set(re.findall(r'\b\d{10}\b', text))
                any_valid = [t for t in any_tins if validate_tin(t)]
                if any_valid:
                    activation_tin = any_valid[0]
                else:
                    activation_tin = expected_prefix + "00000000"
            else:
                activation_tin = valid_tins[0]
            
            # Format name as "Name (Prefix)"
            formatted_name = f"{name} ({expected_prefix})"
            
            # Lưu vào database
            cursor.execute("""
                INSERT INTO provinces (name, prefix, activation_tin)
                VALUES (%s, %s, %s)
                ON CONFLICT (prefix) DO UPDATE SET 
                    name = EXCLUDED.name,
                    activation_tin = EXCLUDED.activation_tin
            """, (formatted_name, expected_prefix, activation_tin))
            conn.commit()
            
            print(f"OK (Activation TIN: {activation_tin})")
            
        except Exception as e:
            print(f"LỖI: {e}")
            conn.rollback()
            
        time.sleep(1.0)
        
    cursor.close()
    conn.close()
    print("Hoàn tất quá trình cào và import dữ liệu với Prefix chuẩn!")

if __name__ == "__main__":
    scrape_and_import()
