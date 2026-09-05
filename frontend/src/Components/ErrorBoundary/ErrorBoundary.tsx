import { Component, type ContextType, type ErrorInfo, type ReactNode } from "react"
import { ctaCompactClass } from "../../Helpers/formStyles"
import { LanguageContext } from "../../i18n/LanguageContext"

type Props = {
    children: ReactNode
}

type State = {
    hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
    // A crash still has to speak the reader's language, and a class component
    // cannot call the hook -- so the context is read the legacy way.
    static contextType = LanguageContext
    declare context: ContextType<typeof LanguageContext>

    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Unhandled render error caught by ErrorBoundary:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            const { t } = this.context

            return (
                <div className="w-full min-h-screen bg-onyx-canvas font-sans flex items-center justify-center px-6">
                    <div className="max-w-md w-full bg-graphite-card ring-1 ring-inset ring-mist-border/6 rounded-card p-card text-center flex flex-col items-center space-y-4">
                        <h1 className="text-heading-sm font-normal text-ivory-text">
                            {t("state.error.title")}
                        </h1>
                        <p className="text-body font-normal text-ash-text">
                            {t("state.error.body")}
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className={ctaCompactClass}
                        >
                            {t("state.error.retry")}
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
