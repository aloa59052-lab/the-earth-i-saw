// ==========================================
// GOOGLE DRIVE SYNC ENGINE (BUG FIXED)
// ==========================================

window.CloudSyncEngine = {
    CLIENT_ID: '191821322381-6sodjm8uk15j8lvekpclfhfn05ln9q6l.apps.googleusercontent.com', 
    API_KEY: 'AIzaSyCO7zrxR6T3uqOtHB-LSq4yCAqHR65DARU',
    
    DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    SCOPES: 'https://www.googleapis.com/auth/drive.appdata',
    tokenClient: null,
    gapiInited: false,
    gisInited: false,
    fileId: null,

    init: function() {
        gapi.load('client', this.initializeGapiClient.bind(this));
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.CLIENT_ID,
            scope: this.SCOPES,
            callback: '', 
        });
        this.gisInited = true;
    },

    initializeGapiClient: async function() {
        await gapi.client.init({
            apiKey: this.API_KEY,
            discoveryDocs: [this.DISCOVERY_DOC],
        });
        this.gapiInited = true;
        this.checkExistingSession();
    },

    checkExistingSession: function() {
        const savedToken = localStorage.getItem('gdrive_token');
        if (savedToken) {
            gapi.client.setToken(JSON.parse(savedToken));
            this.findAppFile();
        }
    },

    authorize: function(callback) {
        if (!this.gapiInited || !this.gisInited) return;
        
        if (gapi.client.getToken() === null) {
            this.tokenClient.callback = async (resp) => {
                if (resp.error) throw resp;
                localStorage.setItem('gdrive_token', JSON.stringify(gapi.client.getToken()));
                await this.findAppFile(); // 🕒 AWAIT যুক্ত করা হয়েছে যাতে ডাউনলোড শেষ হওয়া পর্যন্ত অপেক্ষা করে
                if(callback) callback();
            };
            this.tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            this.tokenClient.requestAccessToken({prompt: ''});
        }
    },

    findAppFile: async function() {
        try {
            const response = await gapi.client.drive.files.list({
                spaces: 'appDataFolder',
                fields: 'files(id, name)',
                pageSize: 1
            });
            if (response.result.files.length > 0) {
                this.fileId = response.result.files[0].id;
                await this.downloadData(); // 🕒 AWAIT যুক্ত করা হয়েছে
            } else {
                await this.createAppFile(); // 🕒 AWAIT যুক্ত করা হয়েছে
            }
        } catch (err) {
            console.error("Drive error:", err);
        }
    },

    createAppFile: async function() {
        const fileMetadata = {
            'name': 'TheEarthISaw_Data.json',
            'parents': ['appDataFolder']
        };
        try {
            const response = await gapi.client.drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            });
            this.fileId = response.result.id;
            this.syncToDrive(window.DataBridge.get());
        } catch (err) {
            console.error("File creation failed:", err);
        }
    },

    syncToDrive: async function(appData) {
        if (!this.fileId || !gapi.client.getToken()) return;
        
        const fileContent = JSON.stringify(appData);
        const file = new Blob([fileContent], {type: 'application/json'});
        const metadata = { 'name': 'TheEarthISaw_Data.json', 'mimeType': 'application/json' };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);

        try {
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=multipart`, {
                method: 'PATCH',
                headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
                body: form
            });
            console.log("Cloud Sync Successful!");
        } catch (err) {
            console.error("Sync failed:", err);
        }
    },

    downloadData: async function() {
        if (!this.fileId) return;
        try {
            const response = await gapi.client.drive.files.get({
                fileId: this.fileId,
                alt: 'media'
            });
            if (response.body) {
                const cloudData = JSON.parse(response.body);
                const localData = window.DataBridge.get();
                
                // 🕒 স্মার্ট টাইমস্ট্যাম্প চেকিং (Smart Conflict Resolution)
                const cloudTime = cloudData.lastUpdated || 0;
                const localTime = localData.lastUpdated || 0;

                if (cloudTime > localTime || (!localData.lastUpdated && cloudData.lastUpdated)) {
                    // ক্লাউডের ডেটা নতুন হলে লোকাল মেমোরি আপডেট করবে (এবং জোর করে আবার ক্লাউডে পাঠাবে না)
                    window.DataBridge.save(cloudData, true); 
                    window.postMessage({ action: 'cloudDataUpdated' }, '*');
                } else if (localTime > cloudTime) {
                    // লোকাল ডেটা নতুন হলে ক্লাউডে পাঠিয়ে দেবে
                    this.syncToDrive(localData);
                }
            }
        } catch (err) {
            console.error("Download failed:", err);
        }
    }
};

window.onload = function() {
    if (window.CloudSyncEngine) window.CloudSyncEngine.init();
};