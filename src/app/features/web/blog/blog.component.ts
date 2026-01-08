import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  templateUrl: './blog.component.html',
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class BlogComponent implements OnInit {
  posts = signal<any[]>([]);

  ngOnInit() {
    this.posts.set([
      { id: 1, title: 'Nuevas Tendencias en Calzado 2026', category: 'MODA', date: new Date(), image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop', excerpt: 'Descubre cómo los materiales sustentables están revolucionando la industria del calzado este año.' },
      { id: 2, title: 'La importancia de un buen SKU', category: 'LOGÍSTICA', date: new Date(), image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop', excerpt: 'Cómo organizar tu inventario para maximizar las ventas en canales digitales.' },
      { id: 3, title: 'Exportando a Europa: Guía Práctica', category: 'NEGOCIOS', date: new Date(), image: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=2070&auto=format&fit=crop', excerpt: 'Todo lo que necesitas saber sobre normativas y logística para llevar tu marca al viejo continente.' }
    ]);
  }
}
