export const editorInit = (id: string) => ({
    height: 320,
    width: '100%',
    selector: `textarea#${id}`,
    toolbar: 'link table bold italic underline textColor forecolor Row ColumnRow  goldText ',
    plugins: 'link table',
    default_link_target: '_blank',
    keepStyles: false,
    forcePNewlines: false,
    setup(editor: any) {
        editor.ui.registry.addButton('goldText', {
            type: 'button',
            text: 'goldText',
            onAction(_: any) {
                editor.insertContent('<span class="gold-typography">text gold</span>')
            },
        })
        editor.ui.registry.addButton('row', {
            type: 'button',
            text: 'Row',
            onAction(_: any) {
                editor.insertContent('<div class="typography-row"><div class="typography-row-content">Row content</div></div>')
            },
        })
        editor.ui.registry.addButton('ColumnRow', {
            type: 'button',
            text: 'Column-Row',
            onAction(_: any) {
                editor.insertContent(`
                <div class="typography-column-row">
                            <div class="typography-column"><div class="typography-row"><div class="typography-row-content">Row content</div></div>column content</div>
                            <div class="typography-column"><div class="typography-row"><div class="typography-row-content">Row content</div></div>column content</div>
                </div>&nbsp;
                `)
            },
        })
    },
    content_style: `
    .typography-row{width: 100%; border:solid 4px #eee; margin:1rem 0rem; display: flex; flex-wrap: wrap; background: rgba(0,0,0,0.03);padding:0.5rem; }  
    .typography-column-row{display:flex; flex-wrap:wrap; width: 100%; margin:0.5rem; padding:0rem; background: rgba(0,0,0,0.1)}
    .typography-column{display:flex; gap:0.25rem; flex-wrap:wrap; width: calc(50% - 2rem); margin:0.5rem; padding:0.5rem; background: rgba(0,0,0,0.1)}
    .gold-typography {background: linear-gradient(111.09deg, #FFF561 5.62%, #FFA31E 75.75%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-shadow: -7px 5px 18px rgba(255, 163, 30, 0.33);}
    `,
})
