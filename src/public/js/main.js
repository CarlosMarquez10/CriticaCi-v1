// JavaScript principal para CriticaCi

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Funcionalidad de drag and drop para upload
    const uploadAreas = document.querySelectorAll('.upload-area');
    
    uploadAreas.forEach(area => {
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });

        area.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });

        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            const fileInput = this.querySelector('input[type="file"]');
            
            if (fileInput && files.length > 0) {
                fileInput.files = files;
                updateFileList(fileInput);
            }
        });
    });

    // Actualizar lista de archivos seleccionados
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            updateFileList(this);
        });
    });

    // Confirmación para eliminar archivos
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const fileName = this.dataset.filename;
            
            if (confirm(`¿Estás seguro de que deseas eliminar el archivo "${fileName}"?`)) {
                deleteFile(this.href, fileName);
            }
        });
    });

    // Animaciones de entrada
    const cards = document.querySelectorAll('.card, .file-item');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });
});

// Función para actualizar la lista de archivos seleccionados
function updateFileList(input) {
    const fileListContainer = input.closest('.upload-area').querySelector('.file-preview');
    if (!fileListContainer) return;

    fileListContainer.innerHTML = '';
    
    if (input.files.length > 0) {
        const fileList = document.createElement('div');
        fileList.className = 'mt-3';
        
        Array.from(input.files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'alert alert-info d-flex justify-content-between align-items-center';
            fileItem.innerHTML = `
                <span><i class="fas fa-file me-2"></i>${file.name}</span>
                <small>${formatFileSize(file.size)}</small>
            `;
            fileList.appendChild(fileItem);
        });
        
        fileListContainer.appendChild(fileList);
    }
}

// Función para formatear el tamaño del archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Función para eliminar archivos
function deleteFile(url, fileName) {
    // Mostrar indicador de carga
    const loadingAlert = document.createElement('div');
    loadingAlert.className = 'alert alert-warning';
    loadingAlert.innerHTML = `
        <i class="fas fa-spinner fa-spin me-2"></i>
        Eliminando archivo "${fileName}"...
    `;
    document.body.appendChild(loadingAlert);

    fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        document.body.removeChild(loadingAlert);
        
        if (data.success) {
            // Mostrar mensaje de éxito
            showAlert('success', `Archivo "${fileName}" eliminado correctamente`);
            
            // Recargar la página después de un breve delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showAlert('danger', `Error al eliminar el archivo: ${data.message}`);
        }
    })
    .catch(error => {
        document.body.removeChild(loadingAlert);
        showAlert('danger', `Error de conexión: ${error.message}`);
    });
}

// Función para mostrar alertas
function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

// Función para mostrar progreso de subida
function showUploadProgress(percentage) {
    let progressContainer = document.querySelector('.upload-progress');
    
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.className = 'upload-progress mt-3';
        document.querySelector('.upload-area').appendChild(progressContainer);
    }
    
    progressContainer.innerHTML = `
        <div class="progress progress-custom">
            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                 role="progressbar" 
                 style="width: ${percentage}%"
                 aria-valuenow="${percentage}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
                ${percentage}%
            </div>
        </div>
    `;
    
    if (percentage >= 100) {
        setTimeout(() => {
            progressContainer.remove();
        }, 2000);
    }
}