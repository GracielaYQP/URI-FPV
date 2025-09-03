import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  signal,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type VideoItem = { src: string; poster?: string };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bgVideo') bgVideo!: ElementRef<HTMLVideoElement>;
  solidNav = signal(false); // navbar sólida al salir del hero

  // ====== Estado del modal de galería ======
  modalAbierto = false;
  galeriaTitulo = '';
  galeriaActual: VideoItem[] = [];

  // ====== Galerías por servicio ======
  galerias: Record<string, VideoItem[]> = {
    television: [
      { src: 'assets/videos/video-rally-1.mp4', poster: 'assets/img/fotouri.jpeg' },
      { src: 'assets/videos/rally-uri-1.mp4',  poster: 'assets/img/fotouri.jpeg' },
    ],
    tours: [
      { src: 'assets/videos/video-interior-1.mp4', poster: 'assets/img/fotouri.jpeg' },
      { src: 'assets/videos/video-interior-2.mp4', poster: 'assets/img/fotouri.jpeg' },
    ],
    comerciales: [
      { src: 'assets/videos/video-fabrica-1.mp4', poster: 'assets/img/fotouri.jpeg' },
      { src: 'assets/videos/mi-video-FPV.mp4',    poster: 'assets/img/fotouri.jpeg' },
    ],
    festivales: [
      { src: 'assets/videos/video-boliche-1.mp4',   poster: 'assets/img/fotouri.jpeg' },
      { src: 'assets/videos/video-la-fabrica-1.mp4',  poster: 'assets/img/fotouri.jpeg' },
    ],
  };

  // Observers para limpiarlos luego
  private heroObserver?: IntersectionObserver;
  private revealObserver?: IntersectionObserver;

  // ====== Lifecycle ======
  ngAfterViewInit(): void {
    // Autoplay del video del hero (silencioso siempre)
    if (this.bgVideo) {
      const v = this.bgVideo.nativeElement;
      v.muted = true;
      v.playsInline = true;
      const tryPlay = () => v.play().catch(() => setTimeout(tryPlay, 300));
      tryPlay();
    }

    // Navbar: transparente en hero, sólida al scrollear
    const hero = document.getElementById('inicio');
    if (hero) {
      this.heroObserver = new IntersectionObserver(
        (entries) => this.solidNav.set(!entries[0].isIntersecting),
        { rootMargin: '-80px 0px 0px 0px', threshold: 0.05 }
      );
      this.heroObserver.observe(hero);
    }

    // Animaciones de entrada (fade/slide)
    const targets = document.querySelectorAll<HTMLElement>('.reveal');
    this.revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    targets.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 6) * 60}ms`;
      this.revealObserver!.observe(el);
    });
  }

  ngOnDestroy(): void {
    this.heroObserver?.disconnect();
    this.revealObserver?.disconnect();
    document.body.style.overflow = '';
  }

  // ====== Util: asegurar silencio en cualquier <video> ======
  ensureMuted(video: HTMLVideoElement) {
    video.muted = true;
    video.volume = 0;
  }

  // ====== Galería: abrir/cerrar ======
  abrirGaleria(clave: keyof typeof this.galerias, titulo: string) {
    this.galeriaTitulo = titulo;
    this.galeriaActual = this.galerias[clave] || [];
    this.modalAbierto = true;
    document.body.style.overflow = 'hidden'; // bloquea scroll de fondo
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.galeriaActual = [];
    document.body.style.overflow = ''; // restaura scroll
  }

  // Cerrar modal con tecla ESC
  @HostListener('window:keydown.escape')
  onEsc() {
    if (this.modalAbierto) this.cerrarModal();
  }

  // ====== Pantalla completa (mudo también en fullscreen) ======
 abrirEnPantallaCompleta(wrap: HTMLElement, el: HTMLVideoElement) {
  // Mantenemos el video mudo y sin barra de controles
  el.muted = true;
  el.volume = 0;
  el.controls = false;
  el.loop = true;
  el.play().catch(() => {});

  const anyWrap = wrap as any;

  // Pedimos fullscreen sobre el contenedor (no el video)
  if (wrap.requestFullscreen) {
    wrap.requestFullscreen().catch(() => {});
  } else if (anyWrap.webkitRequestFullscreen) {
    anyWrap.webkitRequestFullscreen();
  } else if ((el as any).webkitEnterFullscreen) {
    // Fallback iOS (video nativo; ahí se verá el UI de iOS y el botón "Salir" no aplica)
    (el as any).webkitEnterFullscreen();
  }

  // Restaurar estado al salir
  const onFsChange = () => {
    if (!document.fullscreenElement) {
      // Volvemos al modo decorativo
      el.controls = false;
      el.muted = true;
      el.volume = 0;
      el.play().catch(() => {});
      document.removeEventListener('fullscreenchange', onFsChange);
    }
  };
  document.addEventListener('fullscreenchange', onFsChange);
}

// Botón "Salir" (dentro de fullscreen)
salirPantallaCompleta(ev: Event) {
  ev.stopPropagation(); // que no vuelva a abrir FS por el click en el wrapper
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}
}
