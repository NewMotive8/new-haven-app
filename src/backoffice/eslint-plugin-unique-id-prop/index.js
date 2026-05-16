// index.js
module.exports = {
    rules: {
        'unique-id-prop': {
            create(context) {
                const ids = new Set()

                return {
                    ObjectExpression(node) {
                        const idProperty = node.properties.find(
                            (property) => property.key && property.key.name === 'uniqueId',
                        )

                        if (!idProperty) {
                            return
                        }

                        const idValue = idProperty.value.value

                        if (ids.has(idValue)) {
                            context.report({
                                node: idProperty,
                                message: `The 'uniqueId' property with the value '${idValue}' is not unique.`,
                            })
                        } else {
                            ids.add(idValue)
                        }
                    },
                }
            },
        },
    },
}
