document.addEventListener('DOMContentLoaded', () => {
    const sheetUrlInput = document.getElementById('sheetUrl');
    const loadBtn = document.getElementById('loadBtn');
    const statusMsg = document.getElementById('status');
    const tableSection = document.getElementById('tableSection');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const copyBtn = document.getElementById('copyBtn');

    let currentData = [];
    let currentColumns = [];

    const showStatus = (msg, isError = false) => {
        statusMsg.textContent = msg;
        statusMsg.className = `status-message ${isError ? 'error' : ''}`;
        statusMsg.classList.remove('hidden');
    };

    const hideStatus = () => {
        statusMsg.classList.add('hidden');
    };

    const renderTable = (columns, data) => {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';
        if (columns.length === 0) return;

        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            tableHead.appendChild(th);
        });

        data.forEach(row => {
            const tr = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = row[col] || '';
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        tableSection.classList.remove('hidden');
    };

    const getFormattedUrl = (url) => {
        const matches = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (matches && matches[1]) {
            const baseUrl = `https://docs.google.com/spreadsheets/d/${matches[1]}/gviz/tq?tqx=out:csv`;

            // If running as a local file, we MUST use a proxy to avoid CORS errors
            if (window.location.protocol === 'file:') {
                return `https://corsproxy.io/?${encodeURIComponent(baseUrl)}`;
            }
            return baseUrl;
        }
        return url;
    };

    const loadSheet = async () => {
        const url = sheetUrlInput.value.trim();
        if (!url) {
            showStatus('Please enter a valid Google Sheet URL', true);
            return;
        }

        const fetchUrl = getFormattedUrl(url);

        loadBtn.disabled = true;
        loadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
        hideStatus();
        tableSection.classList.add('hidden');

        Papa.parse(fetchUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0 && results.data.length === 0) {
                    showStatus('Could not read the sheet. Ensure it is "Public" and shared as "Anyone with the link can view".', true);
                } else {
                    currentColumns = results.meta.fields || [];
                    currentData = results.data;
                    renderTable(currentColumns, currentData);
                    showStatus(`Successfully loaded ${currentData.length} records!`);
                    setTimeout(hideStatus, 3000);
                }
                loadBtn.disabled = false;
                loadBtn.textContent = 'Load Data';
            },
            error: (err) => {
                showStatus('Connection failed. Please check your internet or the Sheet URL.', true);
                loadBtn.disabled = false;
                loadBtn.textContent = 'Load Data';
            }
        });
    };

    const filterData = () => {
        const query = searchInput.value.toLowerCase();
        const filtered = currentData.filter(row => {
            return Object.values(row).some(val =>
                String(val).toLowerCase().includes(query)
            );
        });
        renderTable(currentColumns, filtered);
    };

    const copyToClipboard = () => {
        const json = JSON.stringify(currentData, null, 2);
        navigator.clipboard.writeText(json).then(() => {
            const originalInner = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => copyBtn.innerHTML = originalInner, 2000);
        });
    };

    loadBtn.addEventListener('click', loadSheet);
    searchInput.addEventListener('input', filterData);
    copyBtn.addEventListener('click', copyToClipboard);

    if (sheetUrlInput.value) loadSheet();
});
