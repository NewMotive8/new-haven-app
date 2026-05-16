/* eslint-disable max-classes-per-file */
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useEffect, useRef, useState } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import Button from 'components/uiKit/buttons'
import InputGroup from '../inputGroup'
import SelectGroup from '../selectGroup'
import { EditorV2Props } from '.'
import styles from './styles.module.scss'

const Inline: any = Quill.import('blots/inline')

class CustomLink extends Inline {
    static create(value: any) {
        const node = super.create()
        if (typeof value === 'object') {
            Object.keys(value).forEach((key) => {
                node.setAttribute(key, value[key])
            })
        } else {
            node.setAttribute('href', value)
        }
        return node
    }

    static formats(domNode: any) {
        const format: any = {
            href: domNode.getAttribute('href'),
        }
        if (domNode.hasAttribute('class')) {
            format.class = domNode.getAttribute('class')
        }
        return format
    }

    format(name: string, value: any) {
        if (name === 'class' && value) {
            this.domNode.setAttribute(name, value)
        } else {
            super.format(name, value)
        }
    }
}

CustomLink.blotName = 'custom_link'
CustomLink.tagName = 'A'
Quill.register(CustomLink, true)

// Defining CTA Primary class
class CtaPrimary extends CustomLink {
    static blotName: string

    static className: string

    static tagName: string
}
CtaPrimary.blotName = 'cta_primary'
CtaPrimary.className = 'cta-primary'
CtaPrimary.tagName = 'A'
Quill.register(CtaPrimary as any, true)

class CtaSecondary extends CustomLink {
    static blotName: string

    static className: string

    static tagName: string
}
CtaSecondary.blotName = 'cta_secondary'
CtaSecondary.className = 'cta-secondary'
CtaSecondary.tagName = 'A'
Quill.register(CtaSecondary as any, true)

// Clipboard matcher to handle pasting custom links with classes
const Clipboard: any = Quill.import('modules/clipboard')
class CustomClipboard extends Clipboard {
    static matchers = [
        ['A', (node: any, delta: any) => {
            const attributes: any = {}
            if (node.hasAttribute('class')) {
                attributes.class = node.getAttribute('class')
            }
            delta.ops.forEach((op: any) => {
                if (op?.attributes && op?.attributes?.link) {
                    op.attributes = { ...op.attributes, ...attributes }
                }
            })
            return delta
        }],
    ]
}

Quill.register('modules/clipboard', CustomClipboard, true)

interface onChangeI {
    target: {
        value: string;
        id: string;
        name: string;
    };
}

function EditorV2({
    value: initialContent,
    id,
    name,
    onChange,
    label,
    feedback,
    status,
    onFocus,
}: EditorV2Props) {
    const [content, setContent] = useState(initialContent)
    const quillRef = useRef<ReactQuill>(null)
    const [ctaHref, setCtaHref] = useState('/link')
    const [ctaLabel, setCtaLabel] = useState('link label')
    const [ctaStyle, setCtaStyle] = useState('primary')

    const handleChange = (ct: string) => {
        setContent(ct)
        onChange({
            target: {
                value: ct,
                id,
                name,
            },
        })
    }

    const insertCTA = () => {
        const ctaClass = ctaStyle === 'primary' ? 'cta-primary' : 'cta-secondary'
        const cta = {
            href: ctaHref,
            class: ctaClass,
        }
        if (quillRef.current) {
            const quillEditor = quillRef.current.getEditor()
            const range: any = quillEditor.getSelection()
            if (range) {
                quillEditor.format('link', cta)
                quillEditor.insertText(range.index, ctaLabel, 'link', cta.href)
                quillEditor.setSelection((range?.index || 0) + (ctaLabel?.length || 0))
            } else {
                quillEditor.format('link', cta)
                quillEditor.insertText(content.length, ctaLabel, 'link', cta.href)
                quillEditor.setSelection((content?.length || 0) + (ctaLabel?.length || 0) as any)
            }
        }
    }

    useEffect(() => {
        setContent(initialContent)
    }, [initialContent])

    const toolbarOptions = [
        [{ header: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['clean'],
        ['link'],
    ]

    const modules = {
        toolbar: {
            container: toolbarOptions,
        },
        clipboard: {
            matchVisual: false,
        },
    }

    const ctaStyleOptions = [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
    ]

    return (
        <Grid data-status={status} className={styles.wrapper}>
            <Grid className={styles.label}>
                {typeof label === 'string' ? (
                    <Typography translateGroup="input-group-label" translateKey={label} size="sm" />
                ) : (
                    label
                )}
            </Grid>
            <div
                onFocus={onFocus}
                className={styles.content}
                style={{ background: 'var(--editor-bg)', borderRadius: '4pt', width: '100%' }}
            >
                <ReactQuill
                    ref={quillRef}
                    value={content}
                    onChange={handleChange}
                    style={{
                        background: 'var(--editor-bg)',
                        border: 'solid 1px var(--editor-bg)',
                        minHeight: '150px',
                        width: '100%',
                    }}
                    modules={modules}
                />
            </div>
            {feedback && (
                <div className={styles.feedback}>
                    <Typography size="xsm">{feedback}</Typography>
                </div>
            )}
        </Grid>
    )
}

export default EditorV2
