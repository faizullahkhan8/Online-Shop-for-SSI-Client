export const pakistanData = {
    "Sindh": ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Mirpur Khas", "Shikarpur", "Jacobabad", "Dadu", "Thatta"],
    "Punjab": ["Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Sialkot", "Bahawalpur", "Sargodha", "Gujrat", "Sheikhupura", "Jhang", "Sahiwal", "Rahim Yar Khan", "Kasur", "Okara", "Burewala", "Chiniot", "Kamoke", "Hafizabad", "Sadiqabad"],
    "Khyber Pakhtunkhwa": ["Peshawar", "Mardan", "Mingora", "Kohat", "Abbottabad", "Dera Ismail Khan", "Nowshera", "Charsadda", "Mansehra", "Swabi", "Timergara", "Bannu", "Swat", "Chitral"],
    "Balochistan": ["Quetta", "Gwadar", "Khuzdar", "Chaman", "Turbat", "Sibi", "Hub", "Zhob", "Dera Murad Jamali", "Mastung"],
    "Islamabad Capital Territory": ["Islamabad"],
    "Azad Kashmir": ["Muzaffarabad", "Mirpur", "Rawalakot", "Kotli", "Bagh"],
    "Gilgit-Baltistan": ["Gilgit", "Skardu", "Chilas", "Gahkuch", "Aliabad"]
};

export const allCities = Object.values(pakistanData).flat().sort();
export const allProvinces = Object.keys(pakistanData).sort();

