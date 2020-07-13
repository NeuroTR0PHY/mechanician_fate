/**
 * Preload a set of templates to compile and cache them for
 * fast access during rendering
 */
export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        // Sheet partials
    ];
    // Load the template partials
    return loadTemplates(templatePaths);
};
