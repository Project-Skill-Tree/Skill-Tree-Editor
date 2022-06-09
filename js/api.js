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
    delete data.response;

    // remove the "root" field
    delete data.root;

    Object.keys(data).forEach(function(key) {
        let type = data[key];

        type.forEach(function(item) {
            item.type = key;
            item.id = item._id;
            delete item._id;
            delete item.__v;
            if(!item.requires || item.requires.length < 1) item.isRoot = true;
            result.push(item);
        });
    });
    
    return result;
}

async function updateTree(tree) {
    let newTree = await replaceIntermediateReferences(tree);
    let changedNodes = findAllChangedNodes(oldTree, newTree);


    changedNodes.forEach(node => {
        let method = 'PUT';
        let endpoint = (node.type[0].toUpperCase() + node.type.slice(1)).slice(0, -1);
        let url = `${window.localStorage.getItem('api_url')}/v1/${node.type}/update${endpoint}`;
        console.log(url)
        let headers = new Headers();
        headers.append('api_key', window.localStorage.getItem('api_key'));
        headers.append('Content-Type', 'application/json');

        delete node.isNew;
        delete node.isRoot;

        fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(node)
        });
    });
}

async function replaceIntermediateReferences(tree) {
    // for each item that has an intermediate reference, send it to the server and replace the reference with the new id
    let changedNodes = findAllChangedNodes(oldTree, tree).filter(node => node.id.startsWith('IR'));
    let method = 'POST';

    for(node of changedNodes) {
        let endpoint = (node.type[0].toUpperCase() + node.type.slice(1)).slice(0, -1);
        let url = `${window.localStorage.getItem('api_url')}/v1/${node.type}/create${endpoint}`;
        console.log(url)
        let headers = new Headers();
        headers.append('api_key', window.localStorage.getItem('api_key'));
        headers.append('Content-Type', 'application/json');

        delete node.isNew;
        delete node.isRoot;

        let response = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(node)
        })
        response = await response.json();
        console.log(response)
        responseID = response[node.type.slice(0, -1)]["_id"];
        
        if(!responseID) {
            showError('Error creating node \n Some nodes may not have been created.');
            return;
        }
        let newTree = await replaceID(tree, node.id, responseID);
        console.log(newTree);
        tree = newTree;
    }

    return tree;
}