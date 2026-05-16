const { prompt } = require('enquirer')
const fs = require('fs')
const path = require('path')

function convertCase(str, targetCase) {
    switch (targetCase) {
        case 'pascal':
            return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toUpperCase() : word.toLowerCase())).replace(/\s+/g, '')
        case 'kebab':
            return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
        default:
            return str
    }
}

function getSubDirectories(srcPath) {
    return new Promise((resolve, reject) => {
        try {
            const dirs = fs.readdirSync(srcPath).filter((item) => fs.statSync(path.join(srcPath, item)).isDirectory())
            resolve(dirs)
        } catch (error) {
            reject(error)
        }
    })
}
const updateUrls = async (entityName, backEndService) => {
    const urlsFilePath = path.join(__dirname, '../src/utils/services/api/urls.ts')

    // Read the file content
    const fileContent = fs.readFileSync(urlsFilePath, 'utf8')
    const beService = {
        none: 'noService',
        gateway: 'gatewayService',
        jackpot: 'jackpotService',
        'lucky wheel': 'luckyWheelService',
        'Scratch cards': 'scratchCardService',
        'jackpot Race': 'jackpotrace',
    }

    // Identify the pattern for insertion
    const insertionPoint = 'const urls = {'
    const entityUrlContent = `
    ${entityName}: {
        getAll: \`\${urlBase}\${${beService[backEndService]}}\${apiV1}/${convertCase(entityName, 'kebab')}\`,
        create: \`\${urlBase}\${${beService[backEndService]}}\${apiV1}/${convertCase(entityName, 'kebab')}\`,
        update: \`\${urlBase}\${${beService[backEndService]}}\${apiV1}/${convertCase(entityName, 'kebab')}\`,
        delete: \`\${urlBase}\${${beService[backEndService]}}\${apiV1}/${convertCase(entityName, 'kebab')}\`,
    },`

    // Insert the new content after the insertion point
    const newFileContent = fileContent.replace(insertionPoint, `${insertionPoint}${entityUrlContent}`)

    // Write the updated content back to the file
    fs.writeFileSync(urlsFilePath, newFileContent, 'utf8')
}
const setupCrud = async () => {
    const layoutsPath = path.join(__dirname, '../src', 'layouts')
    const serviceFolders = await getSubDirectories(layoutsPath)

    const responses = await prompt([
        {
            type: 'input',
            name: 'entityName',
            message: 'What is the name of the entity?',
        },
        {
            type: 'select',
            name: 'backEndService',
            message: 'What is the back end service?',
            choices: ['none', 'gateway', 'jackpot', 'lucky wheel', 'scratch-cards', 'jackpot Race'],
        },
        {
            type: 'select',
            name: 'serviceFolder',
            message: 'Which service folder should this be placed in?',
            choices: serviceFolders,
        },
    ])

    const { entityName, backEndService, serviceFolder } = responses

    const basePath = path.join(__dirname, '../src', 'layouts', serviceFolder, entityName)

    const dirs = [
        basePath,
        `${basePath}/form`,
        `${basePath}/form/tabs`,
        `${basePath}/footer`,
        `${basePath}/header`,
        `${basePath}/list`,
        path.join(__dirname, '../src', 'utils', 'services', 'api', 'requests', entityName),
    ]

    dirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    })

    const templatesDir = path.join(__dirname, 'crudTemplates')

    const files = [
        { template: `${templatesDir}/form/index.txt`, target: `${basePath}/form/index.tsx` },
        { template: `${templatesDir}/form/formValidation.txt`, target: `${basePath}/form/formValidation.ts` },
        { template: `${templatesDir}/form/tabs/basicTab.txt`, target: `${basePath}/form/tabs/basicTab.tsx` },
        { template: `${templatesDir}/footer/index.txt`, target: `${basePath}/footer/index.tsx` },
        { template: `${templatesDir}/header/index.txt`, target: `${basePath}/header/index.tsx` },
        { template: `${templatesDir}/list/index.txt`, target: `${basePath}/list/index.tsx` },
        { template: `${templatesDir}/list/listSettings.txt`, target: `${basePath}/list/listSettings.tsx` },
        { template: `${templatesDir}/index.txt`, target: `${basePath}/index.tsx` },
        { template: `${templatesDir}/api/index.txt`, target: path.join(__dirname, '../src', 'utils', 'services', 'api', 'requests', entityName, 'index.tsx') },
    ]

    files.forEach((file) => {
        let templateContent = fs.readFileSync(file.template, 'utf8')
        templateContent = templateContent.replace(/{{entityName}}/g, entityName)
        templateContent = templateContent.replace(/{{EntityName}}/g, convertCase(entityName, 'pascal'))
        templateContent = templateContent.replace(/{{entity-name}}/g, convertCase(entityName, 'kebab'))
        fs.writeFileSync(file.target, templateContent, 'utf8')
    })
    updateUrls(entityName, backEndService)
    console.log(`CRUD structure for ${entityName} created in ${serviceFolder} folder!`)
}

module.exports = setupCrud
