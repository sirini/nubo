import "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    setColor: {
      /**
       * Set the color
       */
      setColor: (color: string) => ReturnType
    }
    unsetColor: {
      /**
       * Unset the color
       */
      unsetColor: () => ReturnType
    }
    setLink: {
      /**
       * Set a link
       */
      setLink: (attributes: {
        href: string
        target?: string | null
        rel?: string | null
        class?: string | null
      }) => ReturnType
    }
    unsetLink: {
      /**
       * Unset a link
       */
      unsetLink: () => ReturnType
    }
    toggleHeading: {
      /**
       * Toggle a heading
       */
      toggleHeading: (attributes: { level: 1 | 2 | 3 | 4 }) => ReturnType
    }
  }
}
