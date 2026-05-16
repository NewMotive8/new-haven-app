import TranslationForm from './components/form'

export interface TranslationItemI {
    id?: number;
    key: string;
    value?: string;
    locale?: string;
    client?: string;
    group: string;
    isHtml?: boolean;
    paths?: string[];
    replaces?: any[];
}

interface Props {
    currentTranslation?: TranslationItemI;
}

export default function TranslationsEnv({ currentTranslation }: Props) {
    return (
        <TranslationForm
            currentTranslation={currentTranslation}
        />
    )
}
