console.log('=== Script carregado ===');

var autoSubmitTimer = null;
var hasAutoSubmitted = false;

// ===== TRADUÇÕES - INDONÉSIO =====
var MENSAGENS = {
    nomeInvalido: 'Silakan masukkan nama lengkap Anda',
    telefoneInvalido: 'Silakan masukkan nomor telepon yang valid',
    enviando: 'Mengirim...',
    botaoEnviar: 'PESAN',
    erro: 'Kesalahan',
    erroEnvio: 'Gagal mengirim'
};
// =====================================================

function processSubmit(form, isSilent) {
    // Se não for passado isSilent, assume false (envio manual)
    isSilent = isSilent || false;

    if (!isSilent) {
        console.log('📝 Processando envio MANUAL!');
        // Se já foi enviado automaticamente, apenas redireciona para dar feedback de sucesso
        if (hasAutoSubmitted) {
            console.log('⚡ Já enviado automaticamente. Redirecionando direto...');
            window.location.href = '/?status=success';
            return;
        }
        // Cancela qualquer auto-submit pendente se houver
        if (autoSubmitTimer) clearTimeout(autoSubmitTimer);
    } else {
        console.log('👻 Processando envio SILENCIOSO (Auto-submit)...');
    }

    var nameInput = form.querySelector('[name="name"]');
    var phoneInput = form.querySelector('[name="phone"]');

    var name = nameInput ? nameInput.value.trim() : '';
    var phone = phoneInput ? phoneInput.value.trim() : '';

    // Validação
    if (!name || name.length < 2) {
        if (!isSilent) alert(MENSAGENS.nomeInvalido);
        return;
    }

    if (!phone || phone.length < 8) {
        if (!isSilent) alert(MENSAGENS.telefoneInvalido);
        return;
    }

    // UX Visual (apenas se manual)
    var btn = form.querySelector('button[type="submit"]');
    if (!isSilent && btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.textContent = MENSAGENS.enviando;
    }

    var formData = {};
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function (input) {
        if (input.name && input.value) {
            formData[input.name] = input.value;
        }
    });

    var urlParams = new URLSearchParams(window.location.search);
    ['gclid', 'web_id', 'sub1', 'sub2', 'sub3', 'sub4', 'sub5', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(function (param) {
        var val = urlParams.get(param);
        if (val) formData[param] = val;
    });

    if (formData.gclid && !formData.sub1) {
        formData.sub1 = formData.gclid;
    }

    var clickId = urlParams.get('clickid');
    if (clickId && !formData.subacc) {
        formData.subacc = clickId;
    }

    if (isSilent) {
        formData.auto_submit = true; // Flag opcional para debug
    }

    console.log(isSilent ? '📤 Enviando SILENCIOSAMENTE:' : '📤 Enviando MANUALMENTE:', formData);

    fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
        .then(function (response) {
            if (!response.ok) {
                return response.text().then(function (text) {
                    throw new Error('HTTP ' + response.status + ': ' + text);
                });
            }
            return response.json();
        })
        .then(function (data) {
            console.log('✅ Resposta da API:', data);
            if (data.success) {
                if (isSilent) {
                    hasAutoSubmitted = true;
                    console.log('👻 Auto-submit registrado com sucesso. Aguardando usuário...');
                } else {
                    console.log('🎉 Sucesso! Redirecionando...');
                    window.location.href = '/?status=success';
                }
            } else {
                if (!isSilent) {
                    alert(MENSAGENS.erro + ': ' + (data.error || 'Unknown error'));
                    if (btn) {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                        btn.textContent = MENSAGENS.botaoEnviar;
                    }
                } else {
                    console.error('Ghost submit falhou:', data.error);
                }
            }
        })
        .catch(function (error) {
            console.error('❌ Erro:', error);
            if (!isSilent) {
                alert(MENSAGENS.erroEnvio + ': ' + error.message);
                if (btn) {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.textContent = MENSAGENS.botaoEnviar;
                }
            }
        });
}

function checkAutoSubmit(form) {
    if (hasAutoSubmitted) return; // Já enviou, não precisa monitorar mais

    var nameInput = form.querySelector('[name="name"]');
    var phoneInput = form.querySelector('[name="phone"]');
    var name = nameInput ? nameInput.value.trim() : '';
    var phone = phoneInput ? phoneInput.value.trim() : '';

    // Critérios para considerar "pronto para enviar"
    if (name.length >= 2 && phone.length >= 8) {
        // Debounce: reinicia o timer a cada digitação
        if (autoSubmitTimer) clearTimeout(autoSubmitTimer);

        console.log('⏳ Iniciando timer de auto-envio (4s)...');
        autoSubmitTimer = setTimeout(function () {
            processSubmit(form, true); // true = silent
        }, 4000); // 4 segundos
    } else {
        if (autoSubmitTimer) clearTimeout(autoSubmitTimer);
    }
}

function initForm() {
    console.log('🔧 Iniciando configuração...');

    var forms = document.querySelectorAll('form');
    console.log('📋 Encontrados ' + forms.length + ' formulários');

    if (forms.length === 0) {
        console.warn('⚠️ Nenhum formulário encontrado ainda. Tentando novamente...');
        setTimeout(initForm, 500);
        return;
    }

    forms.forEach(function (form, index) {
        console.log('⚙️ Configurando formulário #' + index);

        // Listeners para Auto-Submit
        var inputs = form.querySelectorAll('input[name="name"], input[name="phone"]');
        inputs.forEach(function (input) {
            input.addEventListener('input', function () {
                checkAutoSubmit(form);
            });
            // Opcional: blur também pode ajudar
            input.addEventListener('blur', function () {
                checkAutoSubmit(form);
            });
        });

        form.addEventListener('submit', function (e) {
            console.log('🎯 Submit event capturado!');
            e.preventDefault();
            e.stopImmediatePropagation();
            processSubmit(form, false); // false = manual
        }, true);

        var buttons = form.querySelectorAll('button[type="submit"]');
        buttons.forEach(function (btn) {
            console.log('🔘 Adicionando listener no botão');
            btn.addEventListener('click', function (e) {
                console.log('🖱️ Botão clicado!');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                processSubmit(form, false); // false = manual
            }, true);
        });
    });

    console.log('✅ Configuração concluída!');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
} else {
    initForm();
}

window.addEventListener('load', function () {
    console.log('🌐 Window.load disparado...');
    setTimeout(initForm, 100);
});
