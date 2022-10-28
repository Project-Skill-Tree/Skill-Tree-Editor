# Skill-Tree-Editor
The Skill Tree Editor allows people to easily edit their own skill trees to add any items, challenges and skills they need. This editor is used to instantiate the database which other services can read from.

## Installation

Create a folder within your projects directory and run the following inside it:

`git clone https://github.com/Project-Skill-Tree/Skill-Tree-Editor.git`

Once finished:

- Run the API, where the API is linked to the MongoDB instance you want to instantiate.
- Copy the API variables into the `export JSON` menu. The API_URL should be of the form http://domain:port *without* /v1/ at the end
- Either:
  - Copy our existing [Skill Tree](https://pastebin.com/BPxq8idb) and paste it into the `import` menu and `save changes` to import it
  - Create your own skill tree by right-clicking to clone skills and edit their properties
- Click `export` and update the tree with the API variables defined