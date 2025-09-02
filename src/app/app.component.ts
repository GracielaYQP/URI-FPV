import { Component, AfterViewInit, ElementRef, ViewChild, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bgVideo') bgVideo!: ElementRef<HTMLVideoElement>;
  solidNav = signal(false);   // navbar sólida al salir del hero

  // guardamos observadores para limpiarlos
  private heroObserver?: IntersectionObserver;
  private revealObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    // ==== Autoplay del video del hero ====
    const v = this.bgVideo.nativeElement;
    v.muted = true;
    v.playsInline = true;
    const tryPlay = () => v.play().catch(() => setTimeout(tryPlay, 300));
    tryPlay();

    // ==== Navbar: transparente en hero, sólida al scrollear ====
    const hero = document.getElementById('inicio');
    if (hero) {
      this.heroObserver = new IntersectionObserver(
        entries => this.solidNav.set(!entries[0].isIntersecting),
        { rootMargin: '-80px 0px 0px 0px', threshold: 0.05 }
      );
      this.heroObserver.observe(hero);
    }

    // ==== Animaciones de entrada (fade/slide) con IntersectionObserver ====
    const targets = document.querySelectorAll<HTMLElement>('.reveal');

    this.revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('is-visible');
            obs.unobserve(entry.target); // no parpadea al hacer scroll
          }
        });
      },
      { root: null, threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    targets.forEach((el, i) => {
      // “stagger” suave adicional (aparte del nth-child del CSS)
      el.style.transitionDelay = `${(i % 6) * 60}ms`;
      this.revealObserver!.observe(el);
    });
  }

  ensureMuted(video: HTMLVideoElement) {
  video.muted = true;
  video.volume = 0;
}

  ngOnDestroy(): void {
    this.heroObserver?.disconnect();
    this.revealObserver?.disconnect();
  }
}
