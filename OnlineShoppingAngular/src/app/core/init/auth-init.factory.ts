import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export function initializeAuth(authService: AuthService): () => Promise<void> {
    return async () => {
        authService.initializeUserFromToken();

        // ✅ Resolve when the user load is complete (even if it already happened)
        await firstValueFrom(authService.userLoaded$);
    };
}
