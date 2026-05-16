/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-cond-assign */
const fs = require('fs')
const path = require('path')

const directoryPath = path.join(__dirname, 'src')

// Adjusted to include both patterns.
const pattern1 = /translateGroup=(["'])([^"']+)\1\s*translateKey=(["'])([^"']+)\3/g
const pattern2 = /textTranslated\(\{\s*group:\s*(["'])([^"']+)\1,\s*key:\s*(["'])([^"']+)\3\s*\}\)/g
const pattern3 = /<InputGroup[^>]*\slabel=["']([^"']+)["'][^>]*>/g

const sortByGroup = (a, b) => {
    if (a.translateGroup < b.translateGroup) {
        return -1
    }
    if (a.translateGroup > b.translateGroup) {
        return 1
    }
    return 0
}
const removeDuplicates = (arr) => {
    const uniqueSet = new Set()

    return arr.filter((item) => {
        const signature = `${item.translateGroup}-${item.translateKey}`

        if (!uniqueSet.has(signature)) {
            uniqueSet.add(signature)
            return true
        }
        return false
    })
}

const extractTranslations = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const matches = []
    let match

    // Extract for the first pattern
    while ((match = pattern1.exec(content)) !== null) {
        matches.push({
            translateGroup: match[2],
            translateKey: match[4],
        })
    }

    // Extract for the second pattern
    while ((match = pattern2.exec(content)) !== null) {
        matches.push({
            translateGroup: match[2],
            translateKey: match[4],
        })
    }

    // Extract for the new third pattern
    while ((match = pattern3.exec(content)) !== null) {
        matches.push({
            translateGroup: 'input-group-label', // This is constant as per your requirement
            translateKey: match[1], // The captured label value
        })
    }

    return matches
}

const getFilesFromDir = (dir) => {
    const filesToReturn = []

    const files = fs.readdirSync(dir)
    for (let i = 0; i < files.length; i++) {
        const name = path.join(dir, files[i])
        const stat = fs.statSync(name)

        if (stat.isDirectory()) {
            filesToReturn.push(...getFilesFromDir(name))
        } else if (name.endsWith('.tsx') || name.endsWith('.ts')) {
            filesToReturn.push(name)
        }
    }

    return filesToReturn
}

const main = () => {
    const translations = []
    const tsFiles = getFilesFromDir(directoryPath)

    for (const filePath of tsFiles) {
        translations.push(...extractTranslations(filePath))
    }
    translations.sort(sortByGroup)
    fs.writeFileSync('./src/utils/static/data/translations.json', JSON.stringify(removeDuplicates(translations), null, 4))
}

main()
