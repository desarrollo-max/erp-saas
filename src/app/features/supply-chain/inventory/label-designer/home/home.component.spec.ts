import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LabelDesignerHomeComponent } from './home.component';
import { ActivatedRoute } from '@angular/router';

describe('LabelDesignerHomeComponent', () => {
  let component: LabelDesignerHomeComponent;
  let fixture: ComponentFixture<LabelDesignerHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelDesignerHomeComponent, RouterTestingModule],
      providers: []
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LabelDesignerHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a link to create new template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const newLink = compiled.querySelector('div[routerLink="new"]');
    expect(newLink).toBeTruthy();
  });

  it('should have a link to history', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const historyLink = compiled.querySelector('div[routerLink="history"]');
    expect(historyLink).toBeTruthy();
  });
});
