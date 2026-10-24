# Edstaq Admin Panel - Google Apps Script Setup Instructions
# ഗൂഗിൾ ആപ്പ്സ് സ്ക്രിപ്റ്റ് സെറ്റപ്പ് ചെയ്യുന്നതിനുള്ള നിർദ്ദേശങ്ങൾ

This guide explains how to deploy `Code.gs` in your Google account to create a live API endpoint for the Edstaq Admin Panel.

---

### Step 1: Open Google Apps Script
1. Go to [https://script.google.com/home](https://script.google.com/home) in your browser (use the same Gmail account that owns the Google Sheets).
2. Click **+ New project** (പുതിയ പ്രൊജക്റ്റ് തുടങ്ങുക).
3. Name your project at the top: `Edstaq Admin API`.

### Step 2: Copy Code
1. Open the file [Code.gs](file:///d:/ANTI%20GRAVITY/Admin%20Panel%20Edstaq/google-scripts/Code.gs).
2. Copy all the code inside it.
3. In the Google Apps Script editor, replace any existing code in `Code.gs` with this copied code.
4. Click the **Save** icon (💾 or `Ctrl + S`).

### Step 3: Deploy as Web App
1. Click the blue **Deploy** button at the top right $\rightarrow$ **New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Fill in the deployment settings:
   - **Description**: `Edstaq Admin Production API v1`
   - **Execute as**: **Me (your Gmail)**
   - **Who has access**: **Anyone** *(This allows the Admin Panel web app to fetch data without complex OAuth popups)*.
4. Click **Deploy**.
5. Click **Authorize access** if prompted by Google, select your Google account, click **Advanced** $\rightarrow$ **Go to Edstaq Admin API (unsafe)**, and click **Allow**.

### Step 4: Copy the Web App URL & Connect in Admin Panel
1. Google Apps Script will display your **Web App URL** (it looks like `https://script.google.com/macros/s/.../exec`).
2. Copy this URL.
3. Open the **Edstaq Admin Panel** web app.
4. Click **Settings** ⚙️ at the top right.
5. In **Data Source**, choose **"Live Google Apps Script"**, paste your URL, and click **Save & Test Connection**.
6. The Admin Panel will instantly sync with your live Google Sheets!

Whenever you update `Code.gs`:
- In Google Apps Script, click **Deploy** $\rightarrow$ **Manage deployments** $\rightarrow$ Click the edit pencil ✏️ $\rightarrow$ Select Version: **New version** $\rightarrow$ Click **Deploy**.
