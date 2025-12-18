export abstract class UserRepository {
    abstract getUserDisplayName(userId: string): Promise<string>;
}
