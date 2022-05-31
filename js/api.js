async function getAllNodes() {
    var api_url;
    try {
        api_url = new URL(window.localStorage.getItem('api_url'));
    }
    catch {
        showError('Invalid API URL');
        return;
    }
    if(!api_url.hostname) {
        showError('API URL is invalid or missing');
        return;
    }
    let api_key = window.localStorage.getItem('api_key');

    console.log(`${api_url.origin}/v1/getNodes`)

    let tree = await fetch(`${api_url.origin}/v1/getNodes`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'api_key': api_key
        }
    }).catch(function(error) {
        showError(error);
    });

    if(!tree) {
        return;
    }

    return tree.json();
}

function formatAPIToEditor(data) {
    let result = [];

    // remove the "root" field
    delete data.root;

    Object.keys(data).forEach(function(key) {
        let type = data[key];

        type.forEach(function(item) {
            item.type = key;
            item.id = item._id;
            delete item._id;
            if(!item.requires || item.requires.length < 1) item.isRoot = true;
            result.push(item);
        });
    });
    
    return result;
}