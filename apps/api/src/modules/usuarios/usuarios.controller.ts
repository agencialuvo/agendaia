import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { EliminarUsuarioDto } from './dto/eliminar-usuario.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAutenticado } from '../auth/tipos';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Roles('PLATAFORMA:ADMIN_MASTER', 'PLATAFORMA:SUPERVISOR', 'CLINICA:ADMIN_MASTER', 'CLINICA:ADMIN')
  @Post()
  crear(@Body() dto: CrearUsuarioDto, @CurrentUser() solicitante: UsuarioAutenticado) {
    return this.usuariosService.crear(dto, solicitante);
  }

  @Roles(
    'PLATAFORMA:ADMIN_MASTER',
    'PLATAFORMA:SUPERVISOR',
    'PLATAFORMA:SOPORTE',
    'CLINICA:ADMIN_MASTER',
    'CLINICA:ADMIN',
  )
  @Get()
  listar(@CurrentUser() solicitante: UsuarioAutenticado) {
    return this.usuariosService.listar(solicitante);
  }

  @Roles('PLATAFORMA:ADMIN_MASTER', 'CLINICA:ADMIN_MASTER', 'CLINICA:ADMIN')
  @Delete(':usuarioId')
  eliminar(
    @Param('usuarioId') usuarioId: string,
    @Body() dto: EliminarUsuarioDto,
    @CurrentUser() solicitante: UsuarioAutenticado,
  ) {
    return this.usuariosService.eliminar(usuarioId, solicitante, dto.claveMaestraEliminacion);
  }
}
