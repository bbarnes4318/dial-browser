import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { authorizeSmsDispatch } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { service_type, record_id, customer_name, customer_phone, new_status, old_status, extra_detail } = body;

    if (!service_type || !customer_name || !customer_phone || !new_status) {
      return Response.json({ error: 'Missing required fields: service_type, customer_name, customer_phone, new_status' }, { status: 400 });
    }

    // Require an authenticated caller; non-admins may only send to their own registered phone
    const auth = await authorizeSmsDispatch(base44, customer_phone, true);
    if (auth.error) return auth.error;

    // Build SMS message based on service type and status
    let title = '';
    let message_body = '';

    if (service_type === 'medical') {
      if (new_status === 'ai_processing') {
        title = 'Medical Request Update';
        message_body = `1 CALL AWAY: Your medical request is being analyzed by our AI triage system${extra_detail ? ` — ${extra_detail}` : ''}. A care coordinator will follow up shortly. Dial *301# for details.`;
      } else if (new_status === 'in_review') {
        title = 'Medical Request In Review';
        message_body = `1 CALL AWAY: Your medical request is now under review by a healthcare provider${extra_detail ? ` — ${extra_detail}` : ''}. We'll notify you when it's ready. Dial *301# for updates.`;
      } else if (new_status === 'action_needed') {
        title = 'Action Needed — Medical';
        message_body = `1 CALL AWAY: Action needed on your medical request${extra_detail ? ` — ${extra_detail}` : ''}. Please dial *301# to provide additional information or approve next steps.`;
      } else if (new_status === 'completed') {
        title = 'Medical Request Complete';
        message_body = `1 CALL AWAY: Your medical request has been completed${extra_detail ? ` — ${extra_detail}` : ''}. View your full report by dialing *301#. Thank you for using 1 Call Medical.`;
      }
    } else if (service_type === 'real_estate') {
      if (new_status === 'ai_processing') {
        title = 'Property Search Update';
        message_body = `1 CALL AWAY: We're matching your property search criteria with available listings${extra_detail ? ` — ${extra_detail}` : ''}. Dial *500# to view early results.`;
      } else if (new_status === 'in_review') {
        title = 'Properties Found';
        message_body = `1 CALL AWAY: We found properties matching your search${extra_detail ? ` — ${extra_detail}` : ''}. An agent is reviewing the best matches for you. Dial *500# to preview.`;
      } else if (new_status === 'action_needed') {
        title = 'Action Needed — Real Estate';
        message_body = `1 CALL AWAY: Your agent needs input on your property search${extra_detail ? ` — ${extra_detail}` : ''}. Dial *500# to review and respond.`;
      } else if (new_status === 'completed') {
        title = 'Property Search Complete';
        message_body = `1 CALL AWAY: Your property search consultation is complete${extra_detail ? ` — ${extra_detail}` : ''}. Tour scheduling is ready. Dial *500# to book a viewing.`;
      }
    } else if (service_type === 'grocery') {
      if (new_status === 'confirmed') {
        title = 'Grocery Order Confirmed';
        message_body = `1 CALL AWAY: Your grocery order has been confirmed${extra_detail ? ` — ${extra_detail}` : ''}. We're picking your items now. Dial *400# to view your cart.`;
      } else if (new_status === 'out_for_delivery') {
        title = 'Groceries Out for Delivery';
        message_body = `1 CALL AWAY: Your groceries are out for delivery${extra_detail ? ` — ETA ${extra_detail}` : ''}! Please have your phone ready. Dial *400# to track.`;
      } else if (new_status === 'delivered') {
        title = 'Groceries Delivered';
        message_body = `1 CALL AWAY: Your grocery order has been delivered${extra_detail ? ` — ${extra_detail}` : ''}. Enjoy! Rate your experience by dialing *400#.`;
      } else if (new_status === 'cancelled') {
        title = 'Grocery Order Cancelled';
        message_body = `1 CALL AWAY: Your grocery order has been cancelled${extra_detail ? ` — ${extra_detail}` : ''}. No charges were applied. Dial *400# to place a new order.`;
      }
    } else {
      return Response.json({ error: 'Invalid service_type. Use: medical, real_estate, or grocery' }, { status: 400 });
    }

    if (!message_body) {
      return Response.json({ error: `Status "${new_status}" is not supported for service "${service_type}"` }, { status: 400 });
    }

    // Create the SMS notification record, then deliver via Twilio
    const notification = await base44.asServiceRole.entities.SmsNotification.create({
      notification_type: 'status_update',
      recipient_name: customer_name,
      recipient_phone: customer_phone,
      title,
      message_body,
      related_name: service_type,
      status: 'pending',
      read: false,
    });
    const sms = await sendTwilioSms(customer_phone, message_body);
    try { await base44.asServiceRole.entities.SmsNotification.update(notification.id, { status: sms.status }); } catch { /* best-effort */ }

    return Response.json({
      success: sms.success,
      notification_id: notification.id,
      sms_message: message_body,
      title,
      service_type,
      new_status,
      record_id: record_id || '',
      sms_delivered: sms.success,
      sms_error: sms.success ? undefined : sms.error,
    });
  } catch (error) {
    console.error('sendStatusUpdate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});