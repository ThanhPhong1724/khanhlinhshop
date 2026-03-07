document.addEventListener("DOMContentLoaded", () => {

    // 1. OPEN/CLOSE MODAL 
    const openBtn = document.getElementById('open_form_btn');
    const closeBtn = document.getElementById('close-modal');
    const modal = document.getElementById('order-modal');
    const modalContent = document.querySelector('.order-modal-content');

    // Prevent closing when clicking inside the form
    if (modalContent) {
        modalContent.addEventListener('click', (e) => e.stopPropagation());
    }

    if (openBtn && modal && closeBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
        });

        // Close when clicking X or outside
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', () => modal.classList.remove('active'));
    }

    // 2. RADIO BUTTON UI STYLING
    const comboOpts = document.querySelectorAll('.combo-opt');
    comboOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            comboOpts.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
        });
    });

    const sizeOpts = document.querySelectorAll('.size-opt');
    sizeOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            const input = opt.querySelector('input');
            if (input) {
                const name = input.name;
                document.querySelectorAll(`.size-opt input[name="${name}"]`).forEach(i => {
                    const l = i.closest('.size-opt');
                    if (l) l.classList.remove('selected');
                });
                opt.classList.add('selected');
                input.checked = true;
            }
        });
    });

    // 3. LOCATION API FETCHING
    const provSelect = document.getElementById('province-sel');
    const distSelect = document.getElementById('district-sel');
    const wardSelect = document.getElementById('commune-sel');

    if (provSelect && distSelect && wardSelect) {
        // Fetch Provinces
        fetch('https://provinces.open-api.vn/api/p/')
            .then(res => res.json())
            .then(data => {
                data.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.name;
                    opt.dataset.code = p.code;
                    opt.textContent = p.name;
                    provSelect.appendChild(opt);
                });
            })
            .catch(err => console.error("Error loading provinces", err));

        // When Province changes
        provSelect.addEventListener('change', function () {
            distSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
            wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            wardSelect.disabled = true;

            const selectedOpt = this.options[this.selectedIndex];
            const pCode = selectedOpt.dataset.code;

            if (pCode) {
                distSelect.disabled = false;
                fetch(`https://provinces.open-api.vn/api/p/${pCode}?depth=2`)
                    .then(res => res.json())
                    .then(data => {
                        data.districts.forEach(d => {
                            const opt = document.createElement('option');
                            opt.value = d.name;
                            opt.dataset.code = d.code;
                            opt.textContent = d.name;
                            distSelect.appendChild(opt);
                        });
                    });
            } else {
                distSelect.disabled = true;
            }
        });

        // When District changes
        distSelect.addEventListener('change', function () {
            wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            const selectedOpt = this.options[this.selectedIndex];
            const dCode = selectedOpt.dataset.code;

            if (dCode) {
                wardSelect.disabled = false;
                fetch(`https://provinces.open-api.vn/api/d/${dCode}?depth=2`)
                    .then(res => res.json())
                    .then(data => {
                        data.wards.forEach(w => {
                            const opt = document.createElement('option');
                            opt.value = w.name;
                            opt.textContent = w.name;
                            wardSelect.appendChild(opt);
                        });
                    });
            } else {
                wardSelect.disabled = true;
            }
        });
    }

    // 4. FORM VALIDATION & SUBMISSION
    const form = document.getElementById('replica-form');
    const toast = document.getElementById('toast');
    const submitBtn = document.getElementById('submit-order-btn');

    function showError(id, msg) {
        document.getElementById(id).innerText = msg;
        document.getElementById(id).style.display = 'block';
    }

    function hideErrors() {
        document.querySelectorAll('.err-msg').forEach(e => e.style.display = 'none');
    }

    if (form) {
        // Clear errors on input
        form.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('focus', hideErrors);
            el.addEventListener('change', hideErrors);
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            hideErrors();
            let isValid = true;

            const comboInfo = form.querySelector('input[name="combo"]:checked');
            if (!comboInfo) { showError('err-combo', 'Vui lòng chọn combo'); isValid = false; }

            const colorInfo = form.querySelector('input[name="colors"]:checked');
            if (!colorInfo) { showError('err-color', 'Vui lòng chọn màu sắc'); isValid = false; }

            const sizeInfo = form.querySelector('input[name="size"]:checked');
            if (!sizeInfo) { showError('err-size', 'Vui lòng chọn kích thước'); isValid = false; }

            const name = form.full_name.value.trim();
            if (!name) { showError('err-name', 'Vui lòng nhập họ và tên'); isValid = false; }

            const phone = form.phone_number.value.trim();
            if (!phone || phone.length < 9) { showError('err-phone', 'Số điện thoại không hợp lệ'); isValid = false; }

            if (!form.province_id.value) { showError('err-prov', 'Vui lòng chọn Tỉnh/Thành phố'); isValid = false; }
            if (!form.district_id.value) { showError('err-dist', 'Vui lòng chọn Quận/Huyện'); isValid = false; }
            if (!form.commune_id.value) { showError('err-ward', 'Vui lòng chọn Phường/Xã'); isValid = false; }

            const address = form.address.value.trim();
            if (!address) { showError('err-addr', 'Vui lòng nhập địa chỉ chi tiết'); isValid = false; }

            if (!isValid) return;

            // Submit AJAX
            submitBtn.innerText = "ĐANG XỬ LÝ...";
            submitBtn.disabled = true;

            const formData = new FormData(form);

            fetch('process_order.php', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (!data.success) {
                        // Display actual error messages if any
                        const errorMsg = data.errors ? Object.values(data.errors).join('\\n') : data.message;
                        alert('Lỗi: ' + errorMsg);
                    } else {
                        // Build redirect URL with order summary params
                        const nameVal = form.full_name.value.trim();
                        const phoneVal = form.phone_number.value.trim();
                        const comboVal = comboInfo ? comboInfo.value : '';
                        const colorVal = colorInfo ? colorInfo.value : '';
                        const sizeVal = sizeInfo ? sizeInfo.value : '';

                        const qs = new URLSearchParams({
                            name: nameVal,
                            phone: phoneVal,
                            combo: comboVal,
                            color: colorVal,
                            size: sizeVal
                        }).toString();

                        setTimeout(() => {
                            window.location.href = 'thank_you.html?' + qs;
                        }, 300);

                    }
                })
                .catch(err => {
                    alert('Có lỗi xảy ra khi kết nối máy chủ!');
                })
                .finally(() => {
                    submitBtn.innerText = "XÁC NHẬN ĐẶT HÀNG";
                    submitBtn.disabled = false;
                });
        });
    }

    // 5. DESCRIPTION TOGGLE
    const descToggle = document.getElementById('desc-toggle');
    const descContent = document.getElementById('desc-content');
    if (descToggle && descContent) {
        descToggle.addEventListener('click', () => {
            const isExpanded = descContent.classList.toggle('expanded');
            descToggle.classList.toggle('expanded');
            if (isExpanded) {
                descToggle.innerHTML = 'Thu gọn <svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"></path></svg>';
            } else {
                descToggle.innerHTML = 'Xem thêm <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"></path></svg>';
            }
        });
    }

    // 6. IMAGE CAROUSEL COUNTER
    const gallery = document.getElementById('image-gallery');
    const counter = document.getElementById('slide-counter');
    if (gallery && counter) {
        gallery.addEventListener('scroll', () => {
            const scrollLeft = gallery.scrollLeft;
            const slideWidth = gallery.clientWidth;
            // Calculate current slide (0 to N-1)
            const currentSlide = Math.round(scrollLeft / slideWidth);
            const totalSlides = gallery.children.length;
            counter.innerText = `${currentSlide + 1}/${totalSlides}`;
        });
    }

    // 7. FLASH SALE COUNTDOWN (2 Hours 45 Mins Reset)
    const fsHours = document.getElementById('fs-hours');
    const fsMins = document.getElementById('fs-mins');
    const fsSecs = document.getElementById('fs-secs');

    if (fsHours && fsMins && fsSecs) {
        // Set fixed end time to 2h45m from now for demo purposes, or reset if passed
        let endTime = new Date().getTime() + (2 * 60 * 60 * 1000) + (45 * 60 * 1000);

        function updateFlashSale() {
            const now = new Date().getTime();
            let diff = endTime - now;

            if (diff < 0) {
                // reset to 1 hours if it expires
                endTime = now + (1 * 60 * 60 * 1000);
                diff = endTime - now;
            }

            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            fsHours.innerText = h < 10 ? '0' + h : h;
            fsMins.innerText = m < 10 ? '0' + m : m;
            fsSecs.innerText = s < 10 ? '0' + s : s;
        }

        setInterval(updateFlashSale, 1000);
        updateFlashSale();
    }
});
