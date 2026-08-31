Feature: Como Jefe de Distribución Wealth Management, quiero recibir una alerta cuando se realice un rescate significativo para poder tomar acción comercial con el cliente y recuperar la inversión

  # Considerar clientes que realicen rescates mediante App o Web
	  # Precondiciones:
	  # Cliente con fondos mutuos activos
	  # Cliente con correo electrónico registrado
	  # Parámetros de monto configurados para el envío de alertas
	  # Correo del Jefe de Distribución configurado en parametría
	  # Flujo de rescate operativo en App y Web
	  # Módulo de envío de notificaciones disponible

  Background:
    Given JOY Web se encuentra abierta
    When se inicie sesión con "<tipoDocumento>" "<numeroDocumento>" con la contraseña "<contrasena>" en la pantalla Documento del flujo login
    Then se muestra la pantalla Dashboard del Menú Principal
    And se haga clic en el card "Ver Productos" en la pantalla Dashboard

    # Cobertura funcional
    # 1.- Rescates menores al monto límite configurado
    # 2.- Rescates iguales al monto límite configurado
    # 3.- Rescates mayores al monto límite configurado
    # 4.- Rescates parciales
    # 5.- Rescates totales
    # 6.- Fondos en soles y dólares
    # 7.- Validación de contenido del correo
    # 8.- Validación de parametría de montos
    # 9.- Validación de parametría de destinatario
    # 10.- No regresión del flujo actual de rescate
    # 11.- Cliente con correo registrado
    # 12.- Cliente sin correo registrado


  @DFPEWEMA-2017-001 @josue.lazo @R32 @HP @manual
  Scenario Outline: Completar un rescate menor al monto límite configurado sin generar una alerta

    Given el usuario "<tipoOTP>" se encuentra el fondo "<fondo>" con "<moneda>" en el flujo de rescate en la pantalla Ver productos
    # Para rescate total el fondo debe ser de menos de 30 000 dolares o 100 000 soles
    # Segunda pantalla de la ventana de rescate
    When se muestra el "<tipoDeRescate>", "<formaDePago>" en la pantalla Rescatar

    # Flujo tipo de rescate: Total - Forma de pago: Deposito en cuenta ****
    Then se escoge el "<tipoDeRescate>", "<formaDePago>", "<cuentaDeDestino>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    # Flujo tipo de rescate: Total - Forma de pago: Pago en agencia
    Then se escoge el "<tipoDeRescate>", "<formaDePago>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    # Flujo tipo de rescate: Monto - Forma de pago: Deposito en cuenta
    Then se escoge el "<tipoDeRescate>", "<formaDePago>", "<cuentaDeDestino>" y se ingresa el "<montoARescatar>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    # Flujo tipo de rescate: Monto - Forma de pago: Pago en agencia
    Then se escoge el "<tipoDeRescate>", "<formaDePago>" y se ingresa el "<montoARescatar>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    And se ingresa la "<claveOtp>" como Clave Digital en la pantalla Confirmación
    And se haga clic al botón "Continuar" en la pantalla Confirmación
    Then se muestra la pantalla Listo
    And no se genera una alerta por correo al Jefe de Distribución

    @chrome
    Examples:
      | tipoOTP | moneda  | tipoDeRescate | formaDePago        | cuentaDeDestino | montoARescatar | claveOtp | fondo                                              |
      | PUSH    | Dólares | Parcial       | Deposito en cuenta | Dolares         | 29999          | 1234     | SCOTIA FONDO DE FONDOS ACCIONES EUROPA             |
      | PUSH    | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | 1234     | SCOTIA FONDO DE FONDOS ACCIONES EMERGENTES         |
      | BL      | Soles   | Parcial       | Deposito en cuenta | Soles           | 99999          | 1234     | SCOTIA FONDO CORTO PLAZO PLUS S/                   |
      | BL      | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | 1234     | SCOTIA FONDO CORTO PLAZO PLUS $                    |


    @safari
    Examples:
      | tipoOTP | moneda  | tipoDeRescate | formaDePago        | cuentaDeDestino | montoARescatar | claveOtp | fondo                                              |
      | PUSH    | Dólares | Parcial       | Deposito en cuenta | Dolares         | 29999          | 1234     | Scotia Fondo de Fondos Estrategia Moderada FMIV    |
      | PUSH    | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | 1234     | Scotia Fondo de Fondos Estrategia Crecimiento FMIV |
      | BL      | Soles   | Parcial       | Deposito en cuenta | Soles           | 10000          | 1234     | SCOTIA FONDO MEDIANO PLAZO FLEX S/                 |
      | BL      | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | 1234     | SCOTIA FONDO MEDIANO PLAZO FLEX $                  |



  @DFPEWEMA-2017-002 @josue.lazo @R32 @HP @manual
  Scenario Outline: Completar un rescate igual al monto límite configurado sin generar una alerta

    Given el usuario "<tipoOTP>" se encuentra el fondo "<fondo>" con "<moneda>" en el flujo de rescate en la pantalla Ver productos
    # Para rescate total el fondo debe ser de 30 000 dolares o 100 000 soles
    # Segunda pantalla de la ventana de rescate
    When se muestra el "<tipoDeRescate>", "<formaDePago>" en la pantalla Rescatar

    # Flujo tipo de rescate: Total - Forma de pago: Deposito en cuenta ****
    Then se escoge el "<tipoDeRescate>", "<formaDePago>", "<cuentaDeDestino>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    # Flujo tipo de rescate: Total - Forma de pago: Pago en agencia
    Then se escoge el "<tipoDeRescate>", "<formaDePago>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    # Flujo tipo de rescate: Monto - Forma de pago: Deposito en cuenta
    Then se escoge el "<tipoDeRescate>", "<formaDePago>", "<cuentaDeDestino>" y se ingresa el "<montoARescatar>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    # Flujo tipo de rescate: Monto - Forma de pago: Pago en agencia
    Then se escoge el "<tipoDeRescate>", "<formaDePago>" y se ingresa el "<montoARescatar>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    When se confirma la solicitud de rescate en la pantalla Confirmación
    Then se muestra la pantalla Listo
    And se genera una alerta por correo al Jefe de Distribución

    @chrome
    Examples:
      | tipoOTP | moneda  | tipoDeRescate | formaDePago        | cuentaDeDestino | montoARescatar | fondo                                              |
      | PUSH    | Dólares | Parcial       | Deposito en cuenta | Dolares         | 30000          | SCOTIA FONDO DE FONDOS ACCIONES EMERGENTES         |
      | BL      | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | Scotia Fondo de Fondos Deuda Mercados Emergentes   |
      | BL      | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | Scotia Fondo de Fondos Deuda Global FMIV           |

    @safari
    Examples:
      | tipoOTP | moneda  | tipoDeRescate | formaDePago        | cuentaDeDestino | montoARescatar | fondo                                              |
      | PUSH    | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | SCOTIA FONDO DE FONDOS ACCIONES US                 |
      | PUSH    | Dólares | Parcial       | Deposito en cuenta | Dolares         | 30000          | SCOTIA FONDO DE FONDOS ACCIONES EUROPA             |
      | BL      | Soles   | Parcial       | Deposito en cuenta | Soles           | 100000         | SCOTIA FONDO LIQUIDEZ SOLES                        |
      | BL      | Dólares | Parcial       | Pago en agencia    | Dolares         | 30000          | SCOTIA FONDO LIQUIDEZ $                            |
      | BL      | Soles   | Parcial       | Deposito en cuenta | Soles           | 100000         | SCOTIA FONDO CORTO PLAZO PLUS S/                   |



  @DFPEWEMA-2017-003 @josue.lazo @R32 @HP @manual
  Scenario Outline: Generar una alerta cuando el rescate supera el monto límite configurado

    Given el usuario "<tipoOTP>" se encuentra el fondo "<fondo>" con "<moneda>" en el flujo de rescate en la pantalla Ver productos
    # Para rescate total el fondo debe ser de más de 30 000 dolares o 100 000 soles
    # Segunda pantalla de la ventana de rescate
    When se muestra el "<tipoDeRescate>", "<formaDePago>" en la pantalla Rescatar

    # Flujo tipo de rescate: Total - Forma de pago: Deposito en cuenta ****
    Then se escoge el "<tipoDeRescate>", "<formaDePago>", "<cuentaDeDestino>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    # Flujo tipo de rescate: Total - Forma de pago: Pago en agencia
    Then se escoge el "<tipoDeRescate>", "<formaDePago>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    # Flujo tipo de rescate: Monto - Forma de pago: Deposito en cuenta
    Then se escoge el "<tipoDeRescate>", "<formaDePago>", "<cuentaDeDestino>" y se ingresa el "<montoARescatar>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    # Flujo tipo de rescate: Monto - Forma de pago: Pago en agencia
    Then se escoge el "<tipoDeRescate>", "<formaDePago>" y se ingresa el "<montoARescatar>" con la misma moneda del fondo en la pantalla Rescatar
    When se haga clic al boton "Continuar" en la pantalla Rescatar

    And se confirma la solicitud de rescate en la pantalla Confirmación
    Then se muestra la pantalla Listo
    And se envía la alerta al  Jefe de Distribución a "<correoDestino>"
    And se visualiza en el correo el DNI "<dni>" en el asunto
    And se visualiza en el correo el nombre del cliente "<nombreCliente>" en el asunto
    And se visualiza en el correo el producto "<producto>" en el asunto
    And se visualiza en el correo el monto "<montoRescate>" en el asunto
    And se visualiza en el correo la oficina "<oficina>" en el asunto

    @chrome
    Examples:
      | tipoOTP | moneda  | tipoDeRescate | formaDePago        | cuentaDeDestino | montoARescatar | fondo                                              | correoDestino                 | dni     | nombreCliente | producto | montoRescate | oficina |
      | PUSH    | Dólares | Parcial       | Deposito en cuenta | Dolares         | 30001          | SCOTIA FONDO DE FONDOS ACCIONES EUROPA             | jefe.distribucion@empresa.com | 7777777 | JUAN PEREZ    | FFMM     | 150000       | LIMA    |
      | PUSH    | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | SCOTIA FONDO DE FONDOS ACCIONES EMERGENTES         | jefe.distribucion@empresa.com | 7777777 | JUAN PEREZ    | FFMM     | 150000       | LIMA    |
      | BL      | Soles   | Parcial       | Deposito en cuenta | Soles           | 100001         | SCOTIA FONDO CORTO PLAZO PLUS S/                   | jefe.distribucion@empresa.com | 7777777 | JUAN PEREZ    | FFMM     | 150000       | LIMA    |
      | BL      | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | SCOTIA FONDO CORTO PLAZO PLUS $                    | jefe.distribucion@empresa.com | 7777777 | JUAN PEREZ    | FFMM     | 150000       | LIMA    |


    @safari
    Examples:
      | tipoOTP | moneda  | tipoDeRescate | formaDePago        | cuentaDeDestino | montoARescatar | fondo                                              | correoDestino                 | dni     | nombreCliente | producto | montoRescate | oficina |
      | PUSH    | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | Scotia Fondo de Fondos Estrategia Crecimiento FMIV | jefe.distribucion@empresa.com | 7777777 | JUAN PEREZ    | FFMM     | 150000       | LIMA    |
      | PUSH    | Dólares | Parcial       | Deposito en cuenta | Dolares         | 30001          | SCOTIA FONDO DE FONDOS ACCIONES EMERGENTES         | jefe.distribucion@empresa.com | 7777777 | JUAN PEREZ    | FFMM     | 150000       | LIMA    |
      | BL      | Dólares | Total         | Pago en agencia    | Dolares         | No aplica      | Scotia Fondo de Fondos Deuda Global FMIV           | jefe.distribucion@empresa.com | 7777777 | JUAN PEREZ    | FFMM     | 150000       | LIMA    |
