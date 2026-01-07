export class ObjectQL {
    constructor(config: any) {}
    datasource(name: string) {
        return {
            find: async (query: any) => { return [] }
        }
    }
}
