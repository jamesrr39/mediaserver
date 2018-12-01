export function joinUrlFragments(...fragments: string[]): string {
    const trimmedFragments = fragments.map((fragment, index) => {
        if (fragment.charAt(0) === '/') {
            fragment = fragment.substr(1);
        }

        if (fragment.charAt(fragment.length) === '/') {
            fragment = fragment.substr(0, fragment.length - 1);
        }

        return fragment;
    });

    return trimmedFragments.join('/');
}
