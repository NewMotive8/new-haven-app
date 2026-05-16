const { prompt } = require('enquirer')
const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '../src/components/navbar/sideMenu/links/links.json')
const links = JSON.parse(fs.readFileSync(filePath, 'utf8'))

const createNewPageFile = (href) => {
    const pageDir = path.join(__dirname, '../src/pages', href)

    if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true })
    }

    fs.writeFileSync(path.join(pageDir, 'index.tsx'), `
    import React from 'react'
    import { GetServerSidePropsContext } from 'next'
    import { defaultServerSideProps } from 'utils/functions/serverSide'
    
    export default function Page() {
        return (<EntityCrud />)
    }
    
    export async function getServerSideProps(context: GetServerSidePropsContext) {
        return defaultServerSideProps(context)
    }

    `, 'utf8')
}

const addSideMenu = async () => {
    const groups = Object.keys(links)

    const groupAnswer = await prompt([
        {
            type: 'select',
            name: 'group',
            message: 'Which group do you want to modify?',
            choices: groups,
        },
    ])

    const { group } = groupAnswer

    const hrefAnswer = await prompt([
        {
            type: 'input',
            name: 'href',
            message: 'Enter a custom or just choose the default basePath (press tab to complete)',
            initial: `/${group}/`,
        },
    ])
    const { href } = hrefAnswer

    const translateAnswer = await prompt([
        {
            type: 'input',
            name: 'translateKey',
            message: 'Enter the new translateKey:',
        },
    ])
    const { translateKey } = translateAnswer

    const id = `${group}-${links[group].items.length}`

    const newItem = {
        id,
        href,
        translateGroup: 'side-menu-links',
        translateKey,
    }

    links[group].items.push(newItem)

    fs.writeFileSync(filePath, JSON.stringify(links, null, 4))

    createNewPageFile(href)

    console.log(`Successfully added a new item to the ${group} group!`)
}

module.exports = addSideMenu
