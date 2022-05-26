let childrenCount = {};
let highestId = 0;
let changedTree = [];

let typeTemplates = {
    "item": {
        "title": "item",
        "category": "item",
        "link": "https://www.youtube.com/watch?v=PYaixyrzDOk",
        "type": "item",
        "requires": [],
        "children": []
    },
    "skill": {
        "id": parseInt(highestId + 1),
        "iconName": "skill",
        "title": "challenge",
        "level": 1,
        "goal": "Edit the data",
        "frequency": "DAILY",
        "timelimit": "1x Week",
        "xp": 69,
        "category": "new",
        "type": "skill",
        "requires": [],
        "children": []
    },
    "challenge": {
        "title": "item",
        "category": "item",
        "timelimit": "1x Week",
        "type": "challenge",
        "requires": [],
        "children": []
    }
};

async function drawNode(data, parentId) {
    let node = document.createElement('li');
    let nodeAncor = document.createElement('a');
    let nodeTitle = document.createElement('span');
    nodeTitle.innerHTML = data.title;
    node.classList.add('node');
    node.id = `node-${data.id}`;

    nodeAncor.addEventListener('click', function () {
        showcaseData(findNode(changedTree, data.id));
    });

    nodeAncor.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        let newNode = {
            "id": parseInt(highestId + 1),
            "iconName": "edit",
            "title": "Editing I",
            "level": 1,
            "goal": "Edit the data",
            "frequency": "DAILY",
            "timelimit": "1x Week",
            "xp": 69,
            "category": "new",
            "type": "skill",
            "requires": [],
            "children": []
        };
        addNode(changedTree, parseInt(data.id), newNode);
        drawNode(newNode, data.id);

        return false;
    });

    nodeAncor.appendChild(nodeTitle);
    node.appendChild(nodeAncor);


    if (!parentId && parentId !== 0) {
        document.querySelector('.tree').appendChild(node);
        return;
    }

    let parentNode = document.getElementById(`node-${parentId}-ul`);

    if (!parentNode) {
        let ul = document.createElement('ul');
        ul.id = `node-${parentId}-ul`;
        document.getElementById(`node-${parentId}`).appendChild(ul);
    }

    // update highestId if the new node has a higher id than the current highestId
    if (data.id > highestId) {
        highestId = data.id;
    }

    document.getElementById(`node-${parentId}-ul`).appendChild(node);


}

function addNode(tree, parentId, newNodeData) {
    let parent = findNode(tree, parentId);
    if (parent) {
        if (!parent.children && parent.children != []) parent.children = [];
        parent.children.push(newNodeData.id);
        changedTree.push(newNodeData);
        window.localStorage.setItem('tree', JSON.stringify(changedTree));
    }
    else {
        console.log(`No parent found for ${parentId}`);
    }
}

function drawChildren(list, parent) {
    if (!parent.children) return;
    parent.children.forEach(child => {
        let childData = findNode(list, child);
        drawNode(findNode(list, child), parent.id);
        if (childData) {
            console.log(`Drawing child ${childData.title}`);
            drawChildren(list, childData);
        }
    });
}

function deleteNode(list, nodeId) {
    let node = findNode(list, nodeId);
    
    // delete children
    if(node.children) {
        deleteChildren(list, nodeId);
    }

    // remove child reference from parent
    let parentId = document.getElementById(`node-${node.id}`).parentElement.getAttribute('id').split('-')[1];

    let parentIndex = findNodeIndex(list, parentId);
    if (parent) {
        list[parentIndex].children = list[parentIndex].children.filter(child => child != nodeId);
    }

    document.querySelector(`#node-${nodeId}`).remove();
    window.localStorage.setItem('tree', JSON.stringify(list));
    list.splice(findNodeIndex(list, nodeId), 1);
}

function deleteChildren(list, nodeId) {
    let node = findNode(list, nodeId);
    if (node.children) {
        node.children.forEach(child => {
            deleteChildren(list, child);
            let nodeIndex = findNodeIndex(list, child);
            list.splice(nodeIndex, 1);
        });
    }
}


function addVariables(){
    const api_key = document.querySelector('#api-key-input').value;
    const api_link = document.querySelector('#api-link-input').value;
    localStorage.setItem('API_KEY', api_key);
    localStorage.setItem('API_URL', api_link);
    document.querySelector("#variable-close").click(); 
}

function initializeTree(tree) { 
    let root = getRoot(tree);
    if (root) {
        root.map(node => drawNode(node));
        tree["skills"].map((child,index) => drawChildren(child,root[index]));
    }
    else {
        console.log('No root node found');
        return
    }
}

function init() {
if (typeof localStorage["API_KEY"] === 'undefined' || typeof localStorage["API_URL"] === 'undefined' ){
  const edit_variables_button = document.querySelector("#add-variables");
  edit_variables_button.click();     
  addVariables();
}
// gets the tree from the API, and then displays it
    getTree()
    let tree = JSON.parse(window.localStorage.getItem('tree'));
    initializeTree(tree);
}

function getRoot(list) {
    let root = list["root"];

    return root ? root : null;
}

function findNode(node, id) {
    if (node._id == id) return node;
    else return null;
}

function findNodeIndex(list, id) {
    let index = list.findIndex(item => item.id == id);
    if (index > -1) {
        return index;
    }
    return null;
}

function showcaseData(data) {
    // copy the data from the template to data-inputs
    let skillEditor = document.querySelector('#data-inputs');
    let templateData = document.querySelector(`#node-edit-template`);
    skillEditor.innerHTML = templateData.innerHTML;
    let editFields = skillEditor.querySelector('.edit-fields');

    editFields.innerHTML = '';
    editFields.setAttribute('data-id', data.id);
    skillEditor.querySelector('#node-type').value = data.type;
    skillEditor.querySelector('#node-type').addEventListener('change', function () {
        let type = skillEditor.querySelector('#node-type').value;
        editFields.innerHTML = '';
        let newData = typeTemplates[type];
        newData.children = data.children;
        newData.id = data.id;
        newData.requires = data.requires;
        showcaseData(newData);
    });
    for (let field in data) {
        if(field == 'type' || field == 'children') continue;
        let input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('name', field);
        input.setAttribute('value', data[field]);
        input.setAttribute('placeholder', field);
        input.setAttribute('id', `node-${field}`);
        skillEditor.querySelector('.edit-fields').appendChild(input);
    }
}

function saveButtonClick() {
    let id = parseInt(document.querySelector('.edit-fields').getAttribute('data-id'));
    let data = findNode(changedTree, id);
    let newData = {};
    newData.id = data.id;
    let inputs = document.querySelectorAll('.edit-fields input');
    inputs.forEach(input => {
        newData[input.name] = input.value;
    });
    newData.type = document.querySelector('#node-type').value;

    // data.children = findNode(changedTree, data.id).children;
    updateNode(id, newData);
}

function updateNode(id, data) {
    let node = document.getElementById(`node-${id}`);
    if (node) {
        changedTree[findNodeIndex(changedTree, id)] = data;
        node.querySelector('span').innerHTML = data.title;
        window.localStorage.setItem('tree', JSON.stringify(changedTree));
    }
    else {
        console.log(`No node found for ${id}`);
    }
}

function displayJson() {
    let json = JSON.stringify(changedTree);
    document.querySelector('#json-output').innerHTML = json;
}

function loadJson() {
    document.querySelector('.tree').innerHTML = "";
    let json = document.querySelector('#json-input').value;
    let data = JSON.parse(json);
    initializeTree(data);
}

function loadLastSession() {
    let tree = window.localStorage.getItem('tree');
    document.querySelector('.tree').innerHTML = "";
    if (tree) {
        initializeTree(JSON.parse(tree));
    }
    else {
        console.log('No tree found');
    }
}

document.querySelector("#jsonInputModal").addEventListener('shown.bs.modal', () => {
    if (window.localStorage.getItem('tree')) {
        document.querySelector('.json-input_last-session-container').style.display = "block";
    }
})

document.querySelector("#editor-expand").addEventListener('click', () => {
    let editor = document.querySelector('#node-editor');
    editor.classList.add('expanded');
});

document.querySelector("#editor-close").addEventListener('click', () => {
    let editor = document.querySelector('#node-editor');
    editor.classList.remove('expanded');


});