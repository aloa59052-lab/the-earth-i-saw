// ==========================================
// GOOGLE DRIVE SYNC ENGINE
// ==========================================

window.CloudSyncEngine = {
    // আপনার সেভ করা চাবিগুলো এখানে বসান
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
            callback: '', // defined later
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
                await this.findAppFile();
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
                this.downloadData();
            } else {
                this.createAppFile();
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
                // যদি ক্লাউডের ডেটা লোকালের চেয়ে নতুন হয়, তবে আপডেট করবে
                const localData = window.DataBridge.get();
                if (!localData.lastUpdated || (cloudData.lastUpdated && cloudData.lastUpdated > localData.lastUpdated)) {
                    window.DataBridge.save(cloudData);
                    // UI রিফ্রেশ করার জন্য সিগন্যাল
                    window.postMessage({ action: 'cloudDataUpdated' }, '*');
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