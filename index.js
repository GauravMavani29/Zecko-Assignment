const express = require('express');
const app = express();
const fetch = require('cross-fetch');
const { google } = require('googleapis');

const definedCategories = [
    'BigCommerce',
    'Shopify',
    'WooCommerce',
    'Magento',
]

var siteCategories = [
    ['Category']
];

app.get('/', async(req, res) => {

    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const client = await auth.getClient();


    const googleSheets = google.sheets({ version: 'v4', auth: client });

    const spreadsheetId = '1-8L3oLha6U91yi-DHHNUfoOhr3OF9Jgja5ApYhSq8D0';

    const spreadsheetData = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'Sheet1!A1:A8'
    })

    console.log(spreadsheetData.data.values.length);

    for (let i = 1; i < spreadsheetData.data.values.length; i++) {
        var d = await getSiteCategory(spreadsheetData.data.values[i][0]);
        d = d.toUpperCase();
        siteCategories.push([d]);
    }


    googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'Sheet1!B1:B8',
        valueInputOption: "USER_ENTERED",
        resource: {
            values: siteCategories
        }
    })

    res.send(siteCategories);
})



async function getSiteTechnologies(siteURL) {
    try {
        const req = await fetch(`https://api.wappalyzer.com/v2/lookup?urls=${siteURL}`, {
            headers: {
                'x-api-key': 'API_KEY'
            }
        });
        const data = await req.json();
        console.log(req.status);
        return { status: req.status, siteTechnologies: data[0].technologies };
    } catch (err) {
        console.log(err);
    }
}

async function getSiteCategory(siteURL) {

    const { status, siteTechnologies } = await getSiteTechnologies(siteURL);


    if (status === 200) {
        for (let j = 0; j < siteTechnologies.length; j++) {
            if (definedCategories.includes(siteTechnologies[j].name)) {
                return siteTechnologies[j].name;
            }
        }
        return "Others";
    } else {
        return "Website not working";
    }

}


app.listen(3000, () => {
    console.log('Server is running on port 3000');
})