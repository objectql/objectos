import { Controller, Get, Render, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class ViewsController {
  @Get()
  root(@Res() res: Response) {
    return res.redirect('/dashboard');
  }

  @Get('login')
  @Render('login')
  login() {
    return { title: 'Sign In - ObjectQL' };
  }

  @Get('dashboard')
  @Render('dashboard')
  dashboard() {
    return { title: 'Dashboard - ObjectQL' };
  }
}
