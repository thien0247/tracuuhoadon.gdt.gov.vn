var selectedNoName = "no";
var unSelectedAlertMsg = 'XIN VUI LONG CHON MOT BAN GHI!';
var canNotRemoveAlertMsg = "This record is default record,can not remove!";

function checkSelected() {
	var selected = false;
	for (var i = 0; i < document.getElementsByName(selectedNoName).length; i++) {
		if (document.getElementsByName(selectedNoName)[i].checked) {
			selected = true;
			break;
		}
	}
	return selected;
}


function formAction(frm, eventName, needCheck, autoSubmit) {


	var confirmMsg = "Bạn có muốn hủy bản ghi này?"

	if (eventName == "approve") {

		confirmMsg = "Bạn có muốn hủy bản ghi này?"
	} else if (eventName == "reject") {

		confirmMsg = "Bạn có muốn từ chối bản ghi này?"
	} else if (eventName == "suspend") {

		confirmMsg = "Bạn có muốn tạm ngừng bản ghi này?"
	} else if (eventName == "enable") {

		confirmMsg = "Bạn có muốn kích hoạt mã truy cập này?"
	} else if (eventName == "cancel") {

		confirmMsg = "Bạn có muốn hủy mã truy cập này?"
	} else if (eventName == "resetPassword") {

		confirmMsg = "Bạn có muốn cập nhật lại mật khẩu mã truy cập này?"
	}

	if (needCheck) {
		var selected = checkSelected();
		if (!selected) {
			alert(unSelectedAlertMsg);
			return false;
		}
		if ((eventName == "remove" || eventName == "delete") && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "approve" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "reject" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "suspend" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "enable" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "cancel" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "resetPassword" && !confirm(confirmMsg)) {
			return false;
		}

	}
	frm.dse_nextEventName.value = eventName;
	if (autoSubmit) {
		frm.submit();
		return false;
	}
	return true;
}


function formAction(frm, eventName, needCheck, autoSubmit, needValidate) {


	var confirmMsg = "Bạn có muốn hủy bản ghi này?"

	if (eventName == "approve") {

		confirmMsg = "Bạn có muốn hủy bản ghi này?"
	} else if (eventName == "reject") {

		confirmMsg = "Bạn có muốn từ chối bản ghi này?"
	} else if (eventName == "suspend") {

		confirmMsg = "Bạn có muốn tạm ngừng bản ghi này?"
	} else if (eventName == "enable") {

		confirmMsg = "Bạn có muốn kích hoạt mã truy cập này?"
	} else if (eventName == "cancel") {

		confirmMsg = "Bạn có muốn hủy bản ghi này?"
	} else if (eventName == "resetPassword") {

		confirmMsg = "Bạn có muốn cập nhật lại mật khẩu mã truy cập này?"
	}

	if (needCheck) {
		var selected = checkSelected();
		if (!selected) {
			alert(unSelectedAlertMsg);
			return false;
		}
		if ((eventName == "remove" || eventName == "delete") && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "approve" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "reject" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "suspend" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "enable" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "cancel" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "resetPassword" && !confirm(confirmMsg)) {
			return false;
		}

	}
	if (needValidate) {
		var isPass = validateForm();
		if (!isPass) {
			return false;
		}

	}
	frm.dse_nextEventName.value = eventName;
	if (autoSubmit) {
		frm.submit();
		return false;
	}
	return true;
}

function formSubmitAction(frm, eventName, needCheck, autoSubmit, needValidate) {


	var confirmMsg = "Bạn có muốn hủy bản ghi này?"

	if (eventName == "approve") {

		confirmMsg = "Bạn có muốn hủy bản ghi này?"
	} else if (eventName == "reject") {

		confirmMsg = "Bạn có muốn từ chối bản ghi này?"
	} else if (eventName == "suspend") {

		confirmMsg = "Bạn có muốn tạm ngừng bản ghi này?"
	} else if (eventName == "enable") {

		confirmMsg = "B?n có mu?n t?m ng?ng mã truBạn có muốn kích hoạt mã truy cập nàyy c?p này?"
	} else if (eventName == "cancel") {

		confirmMsg = "Bạn có muốn hủy bản ghi này?"
	} else if (eventName == "resetPassword") {

		confirmMsg = "Bạn có muốn cập nhật lại mật khẩu mã truy cập này?"
	}

	if (needCheck) {
		var selected = checkSelected();
		if (!selected) {
			alert(unSelectedAlertMsg);
			return false;
		}
		if ((eventName == "remove" || eventName == "delete") && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "approve" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "reject" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "suspend" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "enable" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "cancel" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "resetPassword" && !confirm(confirmMsg)) {
			return false;
		}

	}
	if (needValidate) {
		var isPass = validateForm();
		if (!isPass) {
			return false;
		}

	}
	frm.dse_nextEventName.value = eventName;
	if (autoSubmit) {
		frm.submit();
		return false;
	}
	return true;
}

function formActionSpecial(frm, eventName, needCheck, autoSubmit) {


	var confirmMsg = "Bạn có muốn hủy bản ghi này?"

	if (eventName == "approve") {

		confirmMsg = "Bạn có muốn hủy bản ghi này?"
	} else if (eventName == "reject") {

		confirmMsg = "Bạn có muốn từ chối bản ghi này?"
	} else if (eventName == "suspend") {

		confirmMsg = "Bạn có muốn tạm ngừng bản ghi này?"
	} else if (eventName == "enable") {

		confirmMsg = "Bạn có muốn kích hoạt mã truy cập này?"
	} else if (eventName == "cancel") {

		confirmMsg = "Bạn có muốn hủy bản ghi này?"
	} else if (eventName == "resetPassword") {

		confirmMsg = "Bạn có muốn cập nhật lại mật khẩu mã truy cập này?"
	}

	if (needCheck) {
		var selected = checkSelectedSpecial();
		if (selected == 0) {
			alert(unSelectedAlertMsg);
			return false;
		} else if (selected == 2) {
			alert(canNotRemoveAlertMsg);
			return false;
		}
		if ((eventName == "remove" || eventName == "delete") && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "approve" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "reject" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "suspend" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "enable" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "cancel" && !confirm(confirmMsg)) {
			return false;
		} else if (eventName == "resetPassword" && !confirm(confirmMsg)) {
			return false;
		}

	}
	frm.dse_nextEventName.value = eventName;
	if (autoSubmit) {
		frm.submit();
		return false;
	}
	return true;
}

function checkSelectedSpecial() {
	var selected = 0;
	for (var i = 0; i < document.getElementsByName(selectedNoName).length; i++) {
		if (document.getElementsByName(selectedNoName)[i].checked) {
			if (document.getElementsByName(selectedNoName)[i].value == '1') {
				selected = 2;
				break;
			} else {
				selected = 1;
				break;
			}
		}
	}
	return selected;
}

//current time
var timerHandle = null;
var timerRunning = false;
var months = new Array("Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.", "Jul.", "Aug.", "Sept.", "Oct.", "Nov.", "Dec.");
function stopClock() {
	if (timerRunning)
		clearTimeout(timerHandle);
	timerRunning = false;
}
function showTime() {
	var now = new Date();
	var year = now.getFullYear();
	var month = now.getMonth() + 1;
	var date = now.getDate();
	var hours = now.getHours();
	var mins = now.getMinutes();
	var secs = now.getSeconds();
	// var timeVal= months[month];
	var timeVal = "" + date + "/";
	timeVal += "" + month + "/";
	timeVal += "" + year;
	timeVal += "&nbsp;" + ((hours < 12) ? "AM" : "PM");
	timeVal += "&nbsp;" + ((hours <= 12) ? hours : hours - 12);
	timeVal += ((mins < 10) ? ":0" : ":") + mins;
	document.getElementById('timeBoard').innerHTML = timeVal;
	timerHandle = setTimeout("showTime();", 1000);
	timerRunning = true;
}

/**
* @param date1 (patten:mm/dd/yyyy)
* @param date2 (patten:mm/dd/yyyy)
* @return
*/
function compareTime(date1, date2) {
	var date1Array = date1.split("/");
	var date2Array = date2.split("/");
	var year1 = date1Array[2];
	var month1 = date1Array[1];
	var day1 = date1Array[0];
	var year2 = date2Array[2];
	var month2 = date2Array[1];
	var day2 = date2Array[0];
	var compareDate1 = new Date(year1, month1, day1).getTime();
	var compareDate2 = new Date(year2, month2, day2).getTime();
	if (compareDate2 >= compareDate1) {
		return true;
	} else {
		return false;
	}
}

function startClock() {
	stopClock();
	showTime();
}
function formatAmount(s) {
	if (s < 0) {
		return "";
	} else if (s == "") {
		return s;
	} else {
		return new Number(s);
	}
}
function getElement(element) {
	if (element == null) return null;

	if (typeof (element) != "object")
		element = document.getElementById(String(element));

	if (element == null) return null;
	if (element.tagName == null) return null;

	return element;
}

function getFieldValue(element) {
	element = getElement(element);

	if (element == null) return null;

	var method = null;

	switch (element.tagName) {
		case "SELECT":
		case "BUTTON": method = 0; break;
		case "INPUT":
			switch (element.type) {
				case "password":
				case "text":
				case "button":
				case "hidden": method = 0; break;
				case "radio": method = 1; break;
				case "checkbox": method = 2; break;
			}
			break;
		case "TEXTAREA": method = 3; break;
	}

	switch (method) {
		case 0:
			return element.value;
		case 1:
			return (element.checked ? "1" : "0");
		case 2:
			return (element.checked ? "1" : (element.indeterminate ? "X" : "0"));
		case 3:
			{
				return element.innerText;
			}
	}

	return null;
}


function validDateFormat(dateField, dateFormat) {
	var dt = dateField;

	var returndate;

	if ((dt.value == null) || (dt.value == ""))
		return true;

	if (dateFormat.toUpperCase() == 'DD/MM/YYYY') {
		returndate = isDate(dt.value);
	}
	else if (dateFormat.toUpperCase() == 'MM/YYYY') {
		returndate = isMonth(dt.value);
	}
	else if (dateFormat.toUpperCase() == 'YYYY') {
		returndate = isYear(dt.value);
	} else {
		returndate = false;
	}

	if (returndate == false) {
		alert('Đề nghị NNT nhập giá trị dạng (' + dateFormat + ') cho trường này');
		dt.select();
		dt.value = '';
		dt.focus();
		return false;
	} else {
		dt.value = returndate;
		return returndate;
	}
}
function DaysArray(n) {
	for (var i = 1; i <= n; i++) {
		this[i] = 31;
		if (i == 4 || i == 6 || i == 9 || i == 11) { this[i] = 30; }
		if (i == 2) { this[i] = 29; }
	}
	return this;
}
function daysInFebruary(year) {
	return (((year % 4 == 0) && ((!(year % 100 == 0)) || (year % 400 == 0))) ? 29 : 28);
}
function isDate(dtStr) {
	var dtCh = "*";
	if (dtStr == "") return true;
	var daysInMonth = DaysArray(12);

	for (var intElementNr = 0; intElementNr < strSeparatorArray.length; intElementNr++) {
		if (dtStr.indexOf(strSeparatorArray[intElementNr]) != -1)
			dtCh = strSeparatorArray[intElementNr];
	}
	if (dtCh != "*") //neu co ky hieu phan cach
	{
		var pos1 = dtStr.indexOf(dtCh);
		var pos2 = dtStr.indexOf(dtCh, pos1 + 1);
		if (pos1 == -1 || pos2 == -1) {
			return false;
		}
		var strDay = dtStr.substring(0, pos1);
		var strMonth = dtStr.substring(pos1 + 1, pos2);
		var strYear = dtStr.substring(pos2 + 1);
	} else //khong co ky hieu phan cach
	{
		if (dtStr.length > 5) {
			strDay = dtStr.substr(0, 2);
			strMonth = dtStr.substr(2, 2);
			strYear = dtStr.substr(4);
		} else
			return false;
	}

	if (!isInteger(strYear) || !isInteger(strMonth) || !isInteger(strDay))
		return false;

	strYr = strYear;

	if (strDay.charAt(0) == "0" && strDay.length > 1)
		strDay = strDay.substring(1);

	if (strMonth.charAt(0) == "0" && strMonth.length > 1)
		strMonth = strMonth.substring(1);

	for (var i = 1; i <= 3; i++) {
		if (strYr.charAt(0) == "0" && strYr.length > 1) strYr = strYr.substring(1);
	}

	month = parseInt(strMonth);
	day = parseInt(strDay);
	year = parseInt(strYr);

	if (strMonth.length < 1 || month < 1 || month > 12) {
		return false;
	}
	if (strDay.length < 1 || day < 1 || day > 31 || (month == 2 && day > daysInFebruary(year))
		|| ((month == 4 || month == 6 || month == 9 || month == 11) && day > 30) || day > daysInMonth[month]) {
		return false;
	}

	if (year < 50) year += 2000;
	if (year > 50 && year < 1000) year += 1900;
	if (strYear.length < 1 || year == 0 || year < minYear || year > maxYear) {
		return false;
	}
	if (day < 10) day = "0" + day;
	if (month < 10) month = "0" + month;

	return "" + day + "/" + month + "/" + year;
}

function isMonth(dtStr) {
	var dtCh = "*";
	if (dtStr == "") return "";

	for (var intElementNr = 0; intElementNr < strSeparatorArray.length; intElementNr++) {
		if (dtStr.indexOf(strSeparatorArray[intElementNr]) != -1)
			dtCh = strSeparatorArray[intElementNr];
	}

	if (dtCh != "*") //neu co ky hieu phan cach
	{
		var pos1 = dtStr.indexOf(dtCh);

		var strMonth = dtStr.substring(0, pos1);
		var strYear = dtStr.substring(pos1 + 1);
	}
	else	//khong co ky hieu phan cach
	{
		if (dtStr.length > 3) {
			strMonth = dtStr.substr(0, 2);
			strYear = dtStr.substr(2);
		}
		else
			return false;
	}

	if (!isInteger(strYear) || !isInteger(strMonth))
		return false;
	strYr = strYear;

	if (strMonth.charAt(0) == "0" && strMonth.length > 1)
		strMonth = strMonth.substring(1);

	for (var i = 1; i <= 3; i++) {
		if (strYr.charAt(0) == "0" && strYr.length > 1) strYr = strYr.substring(1);
	}

	month = parseInt(strMonth);
	year = parseInt(strYr);

	if (strMonth.length < 1 || month < 1 || month > 12) {
		return false;
	}

	if (year < 50) year += 2000;
	if (year > 50 && year < 1000) year += 1900;
	if (strYear.length < 1 || year == 0 || year < minYear || year > maxYear) {
		return false;
	}
	if (month < 10) month = "0" + month;
	return "" + month + "/" + year;
}

function isYear(dtStr) {
	if (dtStr == "") return "";
	strYear = dtStr;
	strYr = strYear;
	if (!isInteger(strYear)) return false;
	for (var i = 1; i <= 3; i++) {
		if (strYr.charAt(0) == "0" && strYr.length > 1) strYr = strYr.substring(1);
	}

	year = parseInt(strYr);
	if (year < 50) year += 2000;
	if (year > 50 && year < 1000) year += 1900;
	if (strYear.length < 1 || year == 0 || year < minYear || year > maxYear) {
		return false;
	}
	return "" + year;
}

function formatTienVnd(obj) {
	var keyCode = e ? e.target : window.event.srcElement;
	//var keyCode = window.event.keyCode? event.keyCode : event.charCode;
	if (keyCode != 37 && keyCode != 39 && keyCode != 46 && keyCode != 9 && keyCode != 35 && keyCode != 36 && keyCode != 13) {
		var strvalue;
		strvalue = obj.value;
		var num;
		var val = strvalue;
		strvalue = '';
		for (var i = 0; i < val.length; i++) {
			strvalue += getVal(val.charAt(i));
		}
		num = strvalue.toString().replace(/\$|\./g, '');
		if (num.length > 15) num = num.substring(0, 15);
		if (!IsNumeric(num))
			num = "0";
		sign = (num == (num = Math.abs(num)));
		num = Math.floor(num * 100 + 0.50000000001);
		num = Math.floor(num / 100).toString();
		for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++)
			num = num.substring(0, num.length - (4 * i + 3)) + '.' +
				num.substring(num.length - (4 * i + 3));
		eval(obj).value = (((sign) ? '' : '-') + num);
	}
}

function getVal(num) {
	if (num == '' || checkNumeric(num)) {
		return '';
	} else {
		return (num);
	}
}

function checkNumeric(sText) {
	var ValidChars = "0123456789";
	var IsNumber = true;
	if (ValidChars.indexOf(sText) != -1) {
		IsNumber = false;
	}
	return IsNumber;
}

function IsNumeric(sText) {
	var ValidChars = "0123456789.,-";
	var IsNumber = true;
	var Char;

	for (i == 0; i < sText.length && IsNumber == true; i++) {
		Char = sText.charAt(i);
		if (ValidChars.indexOf(Char) == -1) {
			IsNumber = false;
			break;
		}
	}
	return IsNumber;
}
function toNumber(strNumber) {
	var numStr = strNumber;
	if (null == strNumber || '' == strNumber) {
		return 0;
	}

	while (numStr.indexOf('.') != -1) {
		numStr = numStr.replace('.', '');
	}
	while (numStr.indexOf(',') != -1) {
		numStr = numStr.replace(',', '.');
	}
	if (numStr.indexOf('(') != -1) {
		numStr = numStr.replace('(', '');
		numStr = numStr.replace(')', '');
		numStr = '-' + numStr;
	}
	return parseFloat(numStr);
}

function ktraCTrucTIN(strTINObj) {
	var strTIN = strTINObj.replace(/\s+/g, '');
	if (strTIN != '' && (strTIN.length < 10 || strTIN.length > 14)) {
		alert('Mã số thuế không đúng, hãy nhập lại');
		strTINObj.focus();
		return false;
	}
	if (strTIN.length == 10) {
		var n1 = (strTIN.substring(0, 1)) * 31;
		var n2 = (strTIN.substring(1, 2)) * 29;
		var n3 = (strTIN.substring(2, 3)) * 23;
		var n4 = (strTIN.substring(3, 4)) * 19;
		var n5 = (strTIN.substring(4, 5)) * 17;
		var n6 = (strTIN.substring(5, 6)) * 13;
		var n7 = (strTIN.substring(6, 7)) * 7;
		var n8 = (strTIN.substring(7, 8)) * 5;
		var n9 = (strTIN.substring(8, 9)) * 3;
		var n10 = strTIN.substring(9, 10);

		var soDu = (n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9) % 11;
		var hieuSo = 10 - soDu;
		if (strTIN != '' && hieuSo != n10) {
			alert('Mã số thuế không đúng, hãy nhập lại');
			strTINObj.focus();
			return false;
		}
	}
	if (strTIN.length > 10 && strTIN.length < 13) {
		alert('Mã số thuế không đúng, hãy nhập lại');
		strTINObj.focus();
		return false;
	}
	if (strTIN.length == 13) {
		var n11 = toNumber(strTIN.substring(10, 11));
		var n12 = toNumber(strTIN.substring(11, 12));
		var n13 = toNumber(strTIN.substring(12, 13));
		if (!(n11 >= 0 || n11 <= 9) || !(n12 >= 0 || n12 <= 9) || !(n13 >= 0 || n13 <= 9)) {
			alert('Mã số thuế không đúng, hãy nhập lại');
			strTINObj.focus();
			return false;
		}
	}
	if (strTIN.length == 14) {
		var n11 = strTIN.substring(10, 11);
		var n12 = toNumber(strTIN.substring(11, 12));
		var n13 = toNumber(strTIN.substring(12, 13));
		var n14 = toNumber(strTIN.substring(13, 14));

		if (n11 != '-') {
			alert('Mã số thuế không đúng, hãy nhập lại');
			strTINObj.focus();
			return false;
		}
		else {
			if (!(n12 >= 0 || n12 <= 9) || !(n13 >= 0 || n13 <= 9) || !(n14 >= 0 || n14 <= 9)) {
				alert('Mã số thuế không đúng, hãy nhập lại');
				strTINObj.focus();
				return false;
			}
		}
	}
	return true;
}

function isTimeDate(dtStr) {

	var dtCh = "*";
	if (dtStr == "") return true;
	var daysInMonth = DaysArray(12);

	for (var intElementNr = 0; intElementNr < strSeparatorArray.length; intElementNr++) {
		if (dtStr.indexOf(strSeparatorArray[intElementNr]) != -1)
			dtCh = strSeparatorArray[intElementNr];
	}
	if (dtCh != "*") //neu co ky hieu phan cach
	{
		var pos1 = dtStr.indexOf(dtCh);
		var pos2 = dtStr.indexOf(dtCh, pos1 + 1);
		if (pos1 == -1 || pos2 == -1) {
			return false;
		}
		var strDay = dtStr.substring(0, pos1);
		var strMonth = dtStr.substring(pos1 + 1, pos2);
		var strYear = dtStr.substring(pos2 + 1);
	} else	//khong co ky hieu phan cach
	{
		if (dtStr.length > 5) {
			strDay = dtStr.substr(0, 2);
			strMonth = dtStr.substr(2, 2);
			strYear = dtStr.substr(4);
		}
		else
			return false;
	}

	if (!isInteger(strYear) || !isInteger(strMonth) || !isInteger(strDay))
		return false;

	strYr = strYear;

	if (strDay.charAt(0) == "0" && strDay.length > 1)
		strDay = strDay.substring(1);

	if (strMonth.charAt(0) == "0" && strMonth.length > 1)
		strMonth = strMonth.substring(1);

	for (var i = 1; i <= 3; i++) {
		if (strYr.charAt(0) == "0" && strYr.length > 1) strYr = strYr.substring(1);
	}

	month = parseInt(strMonth);
	day = parseInt(strDay);
	year = parseInt(strYr);

	if (strMonth.length < 1 || month < 1 || month > 12) {
		return false;
	}
	if (strDay.length < 1 || day < 1 || day > 31 || (month == 2 && day > daysInFebruary(year)) || day > daysInMonth[month]) {
		return false;
	}

	if (year < 50) year += 2000;
	if (year > 50 && year < 1000) year += 1900;
	if (strYear.length < 1 || year == 0 || year < minYear || year > maxYear) {
		return false;
	}
	if (day < 10) day = "0" + day;
	if (month < 10) month = "0" + month;

	return "" + day + "/" + month + "/" + year;
}

function CompareDate22(dateFrom, dateTo) // checks if datestr is grtr than todate 
{

	var dayFrom, dayTo;
	var monthFrom, monthTo;
	var yearFrom, yearTo;
	// For ToDate 
	var dateToPat = /^(\d{1,2})(\/|-)(\d{1,2})\2(\d{4})$/;
	var matchArrayDateTo = dateTo.match(dateToPat);

	monthTo = matchArrayDateTo[3];
	dayTo = matchArrayDateTo[1];
	yearTo = matchArrayDateTo[4];

	// For From Date 
	var dateFromPat = /^(\d{1,2})(\/|-)(\d{1,2})\2(\d{4})$/;
	var matchArrayDateFrom = dateFrom.match(dateFromPat);

	monthFrom = matchArrayDateFrom[3];
	dayFrom = matchArrayDateFrom[1];
	yearFrom = matchArrayDateFrom[4];

	// get fullYear 
	if (yearTo.length <= 2) {
		dtObj = new Date(yearTo, 10, 10);
		yearTo = dtObj.getFullYear();
	}
	if (yearFrom.length <= 2) {
		dtObj = new Date(yearFrom, 10, 10);
		yearFrom = dtObj.getFullYear();
	}
	if ((monthFrom.length == 1) && (monthFrom < 10)) monthFrom = 0 + monthFrom;
	if ((monthTo.length == 1) && (monthTo < 10)) monthTo = 0 + monthTo;

	if (dayTo.length == 1) dayTo = "0" + dayTo;
	if (dayFrom.length == 1) dayFrom = "0" + dayFrom;

	if (yearFrom > yearTo)
		return -1;
	else if (yearFrom < yearTo) return 1;

	else {
		if (monthFrom > monthTo)
			return -1
		else if (monthFrom < monthTo) return 1
		else {
			if (dayFrom > dayTo) return -1;
			else if (dayFrom < dayTo) return 1;
			else return 0;
		}
	}


} 
