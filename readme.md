https://tracuuhoadon.gdt.gov.vn/Captcha.jpg
Xây dựng rag hay gì đó để trainging bộ mẫu capcha này, sau đó ko cần dùng ai vẫn tự đọc hiểu được


https://tracuuhoadon.gdt.gov.vn/tbphtc.html
https://tracuuhoadon.gdt.gov.vn/gettin.html?tin=4401120823&captchaCode=z2akjs
https://tracuuhoadon.gdt.gov.vn/Captcha.jpg
{"captchaCode":"z2akjs","dvsd":null,"kind":null,"ltd":null,"ngayDen":null,"ngayTu":null,"strMess":null,"tin":"4401120823","tinModel":{"chan_date":"2025-07-18T00:00:00","den_ngay":null,"dvsd":null,"econ_name":"Nhà nước","economy":"01","link":null,"norm_name":"ỦY BAN NHÂN DÂN XÃ TUY AN TÂY","pare_tin":null,"pay_taxo_id":"50907","pay_taxo_name":"Huyện Tuy An - Chi cục Thuế khu vực Tuy An - Đồng XuânFChi cục Thuế huyện Tuy AnF2019F08F04","pay_taxo_name_blhd":"Huyện Tuy An - Chi cục Thuế khu vực Tuy An - Đồng Xuân","regi_date":"2025-07-07T00:00:00","search":false,"status":"00","statusName":"NNT đang hoạt động (đã được cấp GCN ĐKT)","tin":"4401120823","tran_addr":"thôn Trung Lương 1, Xã Tuy An Tây","tran_dist":"50907","tran_fax":null,"tran_tel":null,"tu_ngay":"2025-07-18T00:00:00"}}


Mã số thuế doanh nghiệp thuộc tỉnh đắk lắk: 6001842955 Ngày Cấp GCN: 2026-08-06T00:00:00

## Thông tin Cơ Sở Dữ Liệu PostgreSQL
Hệ thống hiện tại sử dụng PostgreSQL 18.6 để quản lý dữ liệu lớn tập trung:
- **Chuỗi kết nối (DSN):** `postgresql://zzsu:Zzs@123@localhost:5433/taxdb`
- **Cách cài đặt thư viện:** `pip install psycopg2-binary`
- **Bảng dữ liệu:** 
  - `tax_records`: Lưu toàn bộ doanh nghiệp cả nước.
  - `scan_progress`: Lưu tiến độ quét (phân biệt qua khóa chính `prefix`).

function ktraCTrucTIN(strTINObj){
    var strTIN = strTINObj.replace(/\s+/g, '');
    if(strTIN != '' && (strTIN.length < 10 || strTIN.length > 14)){
        alert('Mã số thuế không đúng, hãy nhập lại');
        strTINObj.focus();
        return false;
    }
    if(strTIN.length == 10){
        var n1 = (strTIN.substring(0,1))*31;
        var n2 = (strTIN.substring(1,2))*29;
        var n3 = (strTIN.substring(2,3))*23;
        var n4 = (strTIN.substring(3,4))*19;
        var n5 = (strTIN.substring(4,5))*17;
        var n6 = (strTIN.substring(5,6))*13;
        var n7 = (strTIN.substring(6,7))*7;
        var n8 = (strTIN.substring(7,8))*5;
        var n9 = (strTIN.substring(8,9))*3;
        var n10 = strTIN.substring(9,10);

        var soDu = (n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9)%11;
        var hieuSo = 10 - soDu;
        if(strTIN != '' && hieuSo != n10){
            alert('Mã số thuế không đúng, hãy nhập lại');
            strTINObj.focus();
            return false;
        }
    }
    if(strTIN.length > 10 && strTIN.length < 13){
        alert('Mã số thuế không đúng, hãy nhập lại');
        strTINObj.focus();
        return false;
    }
    if(strTIN.length == 13){
        var n11 = toNumber(strTIN.substring(10,11));
        var n12 = toNumber(strTIN.substring(11,12));
        var n13 = toNumber(strTIN.substring(12,13));
        if(!(n11 >= 0 || n11 <= 9) || !(n12 >= 0 || n12 <= 9) || !(n13 >= 0 || n13 <= 9)){
            alert('Mã số thuế không đúng, hãy nhập lại');
            strTINObj.focus();
            return false;
        }
    }
    if(strTIN.length == 14){
        var n11 = strTIN.substring(10,11);
        var n12 = toNumber(strTIN.substring(11,12));
        var n13 = toNumber(strTIN.substring(12,13));
        var n14 = toNumber(strTIN.substring(13,14));

        if(n11 != '-'){
            alert('Mã số thuế không đúng, hãy nhập lại');
            strTINObj.focus();
            return false;
        }
        else{
            if(!(n12 >= 0 || n12 <= 9) || !(n13 >= 0 || n13 <= 9) || !(n14 >= 0 || n14 <= 9)){
                alert('Mã số thuế không đúng, hãy nhập lại');
                strTINObj.focus();
                return false;
            }
        }
    }
    return true;
}