import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export function initializeAuth(authService: AuthService): () => Promise<void> {
    return () => authService.initializeUserFromToken();
}

// export function initializeAuth(authService: AuthService): () => Promise<void> {
//     return async () => {
//         // authService.initializeUserFromToken();
//         // await firstValueFrom(authService.userLoaded$);
//         await authService.initializeUserFromToken(); // wait for user + loaded flag
//     };
// }
