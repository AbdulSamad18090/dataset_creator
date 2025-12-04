module.exports = {
    apps: [
        {
            name: "dataset_creator",
            script: "npm",
            args: "start",
            env: {
                PORT: 5000
            }
        }
    ]
}
