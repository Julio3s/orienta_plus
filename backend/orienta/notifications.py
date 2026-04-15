import json
import urllib.error
import urllib.request
from urllib.parse import quote

from django.conf import settings
from django.core.mail import send_mail


class NotificationDeliveryError(Exception):
    pass


def normalize_whatsapp_number(value):
    cleaned = ''.join(character for character in str(value or '') if character.isdigit())

    if not cleaned:
        return ''

    if cleaned.startswith('00'):
        cleaned = cleaned[2:]

    if len(cleaned) in {8, 10}:
        cleaned = f'229{cleaned}'

    return cleaned


def _format_notes(notes):
    if not notes:
        return 'Aucune note n a ete transmise.'

    ordered_notes = sorted(notes.items(), key=lambda item: item[0])
    return '\n'.join(f"- {code}: {value}/20" for code, value in ordered_notes)


def _format_resultats(resultats, limit=5):
    formatted_lines = []

    for index, resultat in enumerate(resultats[:limit], start=1):
        universites = resultat.get('universites') or []
        university_names = ', '.join(
            universite.get('universite_nom', '')
            for universite in universites[:3]
            if universite.get('universite_nom')
        )
        university_text = university_names or 'Universites a confirmer'
        statut = resultat.get('label') or resultat.get('statut') or 'Statut indisponible'
        pourcentage = resultat.get('pourcentage', 0)
        moyenne = resultat.get('moyenne_calculee', 'N/A')

        formatted_lines.append(
            f"{index}. {resultat.get('filiere_nom', 'Filiere')} - {statut} - "
            f"{pourcentage}% - moyenne {moyenne}/20 - {university_text}"
        )

    return '\n'.join(formatted_lines) or 'Aucun resultat exploitable.'


def build_simulation_email(payload):
    serie_code = payload.get('serie_code') or 'N/A'
    serie_nom = payload.get('serie_nom') or 'Serie non precisee'
    notes_block = _format_notes(payload.get('notes') or {})
    resultats_block = _format_resultats(payload.get('resultats') or [])

    subject = f"ORIENTA+ - vos resultats de simulation ({serie_code})"
    body = (
        "Bonjour,\n\n"
        "Voici vos resultats de simulation ORIENTA+.\n\n"
        f"Serie: {serie_code} - {serie_nom}\n\n"
        "Notes prises en compte:\n"
        f"{notes_block}\n\n"
        "Meilleures pistes relevees:\n"
        f"{resultats_block}\n\n"
        "Conseil ORIENTA+: comparez les universites, les seuils et les debouches avant de valider votre choix.\n\n"
        "L equipe ORIENTA+"
    )

    return subject, body


def build_whatsapp_message(payload):
    serie_code = payload.get('serie_code') or 'N/A'
    serie_nom = payload.get('serie_nom') or 'Serie non precisee'
    resultats_block = _format_resultats(payload.get('resultats') or [], limit=3)

    return (
        "Bonjour, voici votre recapitulatif ORIENTA+.\n"
        f"Serie: {serie_code} - {serie_nom}\n"
        f"{resultats_block}\n"
        "Comparez bien les seuils, bourses et universites avant de choisir."
    )


def send_results_email(payload, email):
    email_backend = getattr(settings, 'EMAIL_BACKEND', '')
    email_host = getattr(settings, 'EMAIL_HOST', '')

    if email_backend == 'django.core.mail.backends.smtp.EmailBackend' and not email_host:
        raise NotificationDeliveryError(
            'Email non configure. Ajoutez EMAIL_HOST, EMAIL_HOST_USER et EMAIL_HOST_PASSWORD.'
        )

    subject, body = build_simulation_email(payload)
    sent_count = send_mail(
        subject=subject,
        message=body,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@orienta.plus'),
        recipient_list=[email],
        fail_silently=False,
    )

    if not sent_count:
        raise NotificationDeliveryError("L email n a pas pu etre envoye.")

    return {
        'status': 'sent',
        'target': email,
    }


def build_whatsapp_share_url(phone_number, message):
    return f"https://wa.me/{phone_number}?text={quote(message)}"


def send_results_whatsapp(payload, phone_number):
    message = build_whatsapp_message(payload)
    share_url = build_whatsapp_share_url(phone_number, message)

    access_token = getattr(settings, 'WHATSAPP_ACCESS_TOKEN', '')
    phone_number_id = getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', '')

    if not access_token or not phone_number_id:
        return {
            'status': 'share_link',
            'target': phone_number,
            'share_url': share_url,
            'detail': 'WhatsApp API non configuree. Ouvrez le lien pour finaliser le partage.',
        }

    request_payload = {
        'messaging_product': 'whatsapp',
        'to': phone_number,
        'type': 'text',
        'text': {
            'preview_url': False,
            'body': message,
        },
    }

    request = urllib.request.Request(
        url=f"https://graph.facebook.com/v21.0/{phone_number_id}/messages",
        data=json.dumps(request_payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            response_data = json.loads(response.read().decode('utf-8') or '{}')
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode('utf-8', errors='ignore')
        raise NotificationDeliveryError(
            f"Envoi WhatsApp impossible: {error_body or exc.reason}"
        ) from exc
    except urllib.error.URLError as exc:
        raise NotificationDeliveryError(
            f"Connexion WhatsApp impossible: {exc.reason}"
        ) from exc

    return {
        'status': 'sent',
        'target': phone_number,
        'provider': 'meta_whatsapp_cloud',
        'provider_response': response_data,
    }
