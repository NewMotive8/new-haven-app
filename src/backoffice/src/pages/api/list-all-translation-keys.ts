// pages/api/translations.js
import axios from 'axios'
import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'

const directoryPath = path.join(process.cwd(), 'src')

const pattern1 = /translateGroup=(["'])([^"']+)\1\s*translateKey=(["'])([^"']+)\3/g
const pattern2 = /textTranslated\(\{\s*group:\s*(["'])([^"']+)\1,\s*key:\s*(["'])([^"']+)\3\s*\}\)/g
const pattern3 = /<InputGroup[^>]*\slabel=["']([^"']+)["'][^>]*>/g

const extractColumns = (content: string) => {
    const columnPattern = /{\s*key:\s*'([^']+)',\s*uniqueId:\s*'([^']+)',\s*label:\s*'([^']+)'/g
    const columnDefinitions: { uniqueId: string, label: string }[] = []

    let match
    // eslint-disable-next-line no-cond-assign
    while ((match = columnPattern.exec(content)) !== null) {
        columnDefinitions.push({ uniqueId: match[2], label: match[3] })
    }

    return columnDefinitions
}

const extractTranslations = (filePath: any) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const columnsFromLists = extractColumns(content)

    const matches = []
    if (columnsFromLists.length) {
        columnsFromLists.forEach((item) => matches.push(
            { translateGroup: `input-group-label-${item.uniqueId}`, translateKey: item.label },
        ))
    }

    // Extract for the first pattern
    let match = pattern1.exec(content)
    while (match !== null) {
        matches.push({ translateGroup: match[2], translateKey: match[4] })
        match = pattern1.exec(content)
    }

    match = pattern2.exec(content)
    while (match !== null) {
        matches.push({ translateGroup: match[2], translateKey: match[4] })
        match = pattern2.exec(content)
    }

    match = pattern3.exec(content)
    while (match !== null) {
        matches.push({ translateGroup: 'input-group-label', translateKey: match[1] })
        match = pattern3.exec(content)
    }

    matches.push({ translateGroup: 'toast-notifications', translateKey: 'generic-update-success' })
    matches.push({ translateGroup: 'toast-notifications', translateKey: 'generic-create-success' })
    matches.push({ translateGroup: 'selectors', translateKey: 'select-the-operator' })

    return matches
}

const getFilesFromDir = (dir: any) => {
    const filesToReturn: string[] = []
    const files = fs.readdirSync(dir)

    files.forEach((file) => {
        const name = path.join(dir, file)
        const stat = fs.statSync(name)

        if (stat.isDirectory()) {
            filesToReturn.push(...getFilesFromDir(name))
        } else if (name.endsWith('.tsx') || name.endsWith('.ts')) {
            filesToReturn.push(name)
        }
    })

    return filesToReturn
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>,
) {
    if (req.method === 'GET') {
        const translations: { translateGroup: string; translateKey: string }[] = []
        const tsFiles = getFilesFromDir(directoryPath)

        tsFiles.forEach((filePath) => {
            translations.push(...extractTranslations(filePath))
        })

        const uniqueTranslations = translations.reduce((acc: any, current) => {
            const identifier = `${current.translateGroup}-${current.translateKey}`

            if (!acc.tempMap[identifier]) {
                acc.tempMap[identifier] = true
                acc.result.push(current)
            }

            return acc
        }, { tempMap: {}, result: [] }).result

        return res.status(200).json(uniqueTranslations)
    }
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}
