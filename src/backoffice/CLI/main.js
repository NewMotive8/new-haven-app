const { prompt } = require('enquirer')
// const addSideMenu = require('./addSideMenu')
const setupCrud = require('./setupCrud')

const scripts = [
    // {
    //     name: 'Add Menu Item',
    //     command: addSideMenu,
    // },
    {
        name: 'Add Crud Template',
        command: setupCrud,
    },
    // Add more scripts here...
]

const runScript = async () => {
    const answer = await prompt([
        {
            type: 'select',
            name: 'script',
            message: 'Which script do you want to run?',
            choices: scripts.map((scriptItem) => scriptItem.name),
        },
    ])

    const { script } = answer
    const selectedScript = scripts.find((s) => s.name === script)

    if (!selectedScript) {
        console.log(`Unknown script: ${script}`)
        return
    }
    selectedScript.command()
}

runScript()
