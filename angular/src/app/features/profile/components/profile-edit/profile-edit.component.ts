import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfigStateService } from '@abp/ng.core';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  loading = signal(false);
  submitting = signal(false);
  
  currentUser = signal<any>(null);
  previewImage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private configState: ConfigStateService
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      bio: ['', [Validators.maxLength(500)]],
      profileImageUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    
    // Obter dados do usuário atual do ABP
    const user = this.configState.getOne('currentUser');
    
    if (user) {
      this.currentUser.set(user);
      this.profileForm.patchValue({
        name: user.name || '',
        userName: user.userName || '',
        email: user.email || '',
        bio: user.bio || '',
        profileImageUrl: user.profileImageUrl || ''
      });

      if (user.profileImageUrl) {
        this.previewImage.set(user.profileImageUrl);
      }
    }

    this.loading.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens.');
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    // Preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImage.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // TODO: Implementar upload real da imagem
    // Por enquanto, apenas mostra preview
  }

  removeImage(): void {
    this.previewImage.set(null);
    this.profileForm.patchValue({ profileImageUrl: '' });
  }

  onSubmit(): void {
    if (!this.profileForm.valid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    // TODO: Implementar chamada real à API de atualização de perfil
    // Por enquanto, simula salvamento
    setTimeout(() => {
      alert('Perfil atualizado com sucesso!');
      this.router.navigate(['/profile']);
      this.submitting.set(false);
    }, 1000);
  }

  cancel(): void {
    if (confirm('Deseja descartar as alterações?')) {
      this.router.navigate(['/profile']);
    }
  }

  get name() { return this.profileForm.get('name'); }
  get userName() { return this.profileForm.get('userName'); }
  get email() { return this.profileForm.get('email'); }
  get bio() { return this.profileForm.get('bio'); }
}
